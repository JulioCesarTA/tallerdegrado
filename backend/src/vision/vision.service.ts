import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DetectTextCommand, RekognitionClient } from '@aws-sdk/client-rekognition';

type VehicleAnalysis = {
  tipoVehiculo: string;
  marca: string;
  modelo: string;
  color: string;
  caracteristicas: string;
};

@Injectable()
export class VisionService {
  private readonly rekognitionClient?: RekognitionClient;
  private readonly claudeApiKey?: string;
  private readonly claudeModel: string;

  constructor(private readonly configService: ConfigService) {
    const region =
      this.configService.get<string>('AWS_REKOGNITION_REGION') ??
      this.configService.get<string>('AWS_REGION');
    const accessKeyId     = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (region && accessKeyId && secretAccessKey) {
      this.rekognitionClient = new RekognitionClient({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });
    }

    this.claudeApiKey = this.configService.get<string>('CLAUDE_API_KEY');
    this.claudeModel  = this.configService.get<string>('CLAUDE_MODEL') ?? 'claude-haiku-4-5-20251001';
  }

  async extractPlate(file: Express.Multer.File) {
    if (!this.rekognitionClient) {
      throw new InternalServerErrorException('AWS Rekognition no configurado');
    }

    const response = await this.rekognitionClient.send(
      new DetectTextCommand({ Image: { Bytes: file.buffer } }),
    );

    const detections = (response.TextDetections ?? [])
      .filter((d) => d.Type === 'LINE' || d.Type === 'WORD')
      .map((item) => ({
        text: item.DetectedText?.trim().toUpperCase() ?? '',
        confidence: item.Confidence ? Number(item.Confidence) / 100 : 0,
      }))
      .filter((item) => item.text.length >= 4)
      .map((item) => ({
        ...item,
        normalized: item.text.replace(/[^A-Z0-9]/g, ''),
      }))
      .filter((item) => item.normalized.length >= 5);

    const plateCandidates = detections
      .filter((item) =>
        /^[A-Z]{1,4}[0-9]{3,6}$|^[0-9]{3,6}[A-Z]{1,4}$|^[A-Z]{2,4}[0-9]{2,4}[A-Z0-9]{0,2}$/.test(item.normalized),
      )
      .sort((a, b) => b.confidence - a.confidence);

    if (plateCandidates.length) {
      return {
        plate: plateCandidates[0].normalized,
        confidence: plateCandidates[0].confidence,
        provider: 'aws-rekognition',
        rawText: detections.map((d) => d.text),
      };
    }

    const fallback = detections
      .filter((item) => item.normalized.length >= 5 && item.normalized.length <= 9)
      .sort((a, b) => b.confidence - a.confidence);

    if (fallback.length) {
      return {
        plate: fallback[0].normalized,
        confidence: fallback[0].confidence * 0.7,
        provider: 'aws-rekognition',
        rawText: detections.map((d) => d.text),
      };
    }

    return { plate: '', confidence: 0, provider: 'aws-rekognition', rawText: [] };
  }

  async analyzeVehicle(file: Express.Multer.File): Promise<VehicleAnalysis> {
    if (!this.claudeApiKey) {
      throw new InternalServerErrorException('Claude API key no configurada');
    }

    const prompt = `Analiza la imagen del vehiculo y responde SOLO con JSON valido, sin texto adicional:
{
  "tipoVehiculo": "automovil|camioneta|motocicleta|camion|otro",
  "marca": "marca del vehiculo o desconocido",
  "modelo": "modelo del vehiculo o desconocido",
  "color": "color principal del vehiculo",
  "caracteristicas": "estado visible: danos, rayones, abolladuras u observaciones. Maximo 2 oraciones cortas."
}`;

    const mediaType = (file.mimetype as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp') || 'image/jpeg';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.claudeApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.claudeModel,
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: file.buffer.toString('base64'),
                },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({})) as { error?: { type?: string; message?: string } };
      if (response.status === 429) {
        throw new InternalServerErrorException('Limite de Claude alcanzado, espera unos segundos e intenta de nuevo');
      }
      throw new InternalServerErrorException(errBody?.error?.message ?? 'Error al llamar a Claude');
    }

    const data = await response.json() as { content?: Array<{ type: string; text?: string }> };
    const rawText = data.content?.find((c) => c.type === 'text')?.text ?? '';

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new InternalServerErrorException('Respuesta invalida de Claude');

    const parsed = JSON.parse(jsonMatch[0]) as Partial<VehicleAnalysis>;
    return {
      tipoVehiculo:   parsed.tipoVehiculo   || 'desconocido',
      marca:          parsed.marca          || 'desconocido',
      modelo:         parsed.modelo         || 'desconocido',
      color:          parsed.color          || 'desconocido',
      caracteristicas: parsed.caracteristicas || 'Sin observaciones.',
    };
  }
}
