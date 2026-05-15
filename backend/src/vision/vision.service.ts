import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DetectTextCommand,
  RekognitionClient,
} from '@aws-sdk/client-rekognition';

type VehicleAnalysis = {
  vehicleType: string;
  brand: string;
  model: string;
  color: string;
  characteristics: string[];
  damageDetected: boolean;
  damageDetails: string;
  summary: string;
};

@Injectable()
export class VisionService {
  private readonly rekognitionClient?: RekognitionClient;
  private readonly geminiApiKey?: string;
  private readonly geminiModel: string;

  constructor(private readonly configService: ConfigService) {
    const region =
      this.configService.get<string>('AWS_REKOGNITION_REGION') ??
      this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (region && accessKeyId && secretAccessKey) {
      this.rekognitionClient = new RekognitionClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }

    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.geminiModel =
      this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-2.0-flash';
  }

  async extractPlate(file: Express.Multer.File) {
    if (!this.rekognitionClient) {
      return this.simulateOcr(file.originalname);
    }

    const response = await this.rekognitionClient.send(
      new DetectTextCommand({
        Image: {
          Bytes: file.buffer,
        },
      }),
    );

    const candidates = (response.TextDetections ?? [])
      .map((item) => ({
        text: item.DetectedText?.trim().toUpperCase() ?? '',
        confidence: item.Confidence ? Number(item.Confidence) / 100 : 0,
      }))
      .filter((item) => item.text && /[A-Z0-9]/.test(item.text))
      .map((item) => ({
        ...item,
        normalized: item.text.replace(/[^A-Z0-9]/g, ''),
      }))
      .filter((item) => /^[A-Z]{3}[0-9]{3,4}$|^[0-9]{3,4}[A-Z]{3}$/.test(item.normalized))
      .sort((a, b) => b.confidence - a.confidence);

    if (!candidates.length) {
      return this.simulateOcr(file.originalname);
    }

    return {
      plate: candidates[0].normalized,
      confidence: candidates[0].confidence,
      provider: 'aws-rekognition',
      rawText: candidates.map((item) => item.text),
    };
  }

  async analyzeVehicle(file: Express.Multer.File): Promise<VehicleAnalysis> {
    if (!this.geminiApiKey) {
      return this.simulateVehicleAnalysis(file.originalname);
    }

    const prompt = `
Analiza la imagen de un vehiculo universitario y responde SOLO JSON valido con esta estructura:
{
  "vehicleType": "automovil|camioneta|motocicleta|camion|otro",
  "brand": "marca aproximada",
  "model": "modelo aproximado",
  "color": "color dominante",
  "characteristics": ["lista corta de rasgos visibles"],
  "damageDetected": true,
  "damageDetails": "descripcion breve de golpes, rayones, abolladuras o 'sin danos visibles'",
  "summary": "resumen ejecutivo en una sola frase"
}
Si no puedes inferir algo, usa "desconocido" o lista vacia.
`.trim();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: file.mimetype,
                    data: file.buffer.toString('base64'),
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (!response.ok) {
      return this.simulateVehicleAnalysis(file.originalname);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    };

    const rawText =
      data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';

    try {
      const parsed = JSON.parse(rawText) as VehicleAnalysis;
      return {
        vehicleType: parsed.vehicleType || 'desconocido',
        brand: parsed.brand || 'desconocido',
        model: parsed.model || 'desconocido',
        color: parsed.color || 'desconocido',
        characteristics: parsed.characteristics ?? [],
        damageDetected: Boolean(parsed.damageDetected),
        damageDetails: parsed.damageDetails || 'sin datos',
        summary: parsed.summary || 'Analisis generado por Gemini',
      };
    } catch {
      return this.simulateVehicleAnalysis(file.originalname);
    }
  }

  private simulateOcr(fileName: string) {
    const base = fileName.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const plateMatch = base.match(/[A-Z]{3}[0-9]{3,4}|[0-9]{3,4}[A-Z]{3}/);

    return {
      plate: plateMatch?.[0] ?? `UAG${Math.floor(Math.random() * 900 + 100)}`,
      confidence: plateMatch ? 0.91 : 0.62,
      provider: 'simulado',
      rawText: [base],
    };
  }

  private simulateVehicleAnalysis(fileName: string): VehicleAnalysis {
    const normalized = fileName.toLowerCase();
    const color = normalized.includes('rojo')
      ? 'rojo'
      : normalized.includes('blanco')
        ? 'blanco'
        : normalized.includes('azul')
          ? 'azul'
          : 'gris';

    return {
      vehicleType: normalized.includes('moto') ? 'motocicleta' : 'automovil',
      brand: normalized.includes('toyota') ? 'Toyota' : 'desconocido',
      model: normalized.includes('hilux') ? 'Hilux' : 'sedan aproximado',
      color,
      characteristics: ['placa visible', 'carroceria frontal detectable'],
      damageDetected: normalized.includes('rayon') || normalized.includes('golpe'),
      damageDetails:
        normalized.includes('rayon') || normalized.includes('golpe')
          ? 'Se observan posibles danos superficiales en la carroceria'
          : 'sin danos visibles',
      summary: 'Analisis vehicular generado en modo simulado',
    };
  }
}
