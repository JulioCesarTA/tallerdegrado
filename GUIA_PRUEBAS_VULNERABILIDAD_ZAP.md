# Guía — Pruebas de Vulnerabilidad con OWASP ZAP
### Sistema de Control Vehicular UAGRM
> Cómo escanear TU software (NestJS + Next.js + Nginx + Docker) y armar la sección de pruebas de vulnerabilidad de la tesis.
---
## 1. ¿Qué es OWASP ZAP?

OWASP ZAP (Zed Attack Proxy) es una herramienta gratuita y de código abierto del proyecto **OWASP (Open Web Application Security Project)** para identificar vulnerabilidades de seguridad en aplicaciones web. Funciona como un **proxy de interceptación** entre el navegador y la aplicación, analizando el tráfico HTTP/HTTPS en tiempo real.
Permite dos tipos de análisis:
- **Escaneo pasivo:** observa el tráfico sin modificarlo, detectando configuraciones inseguras.
- **Escaneo activo:** simula ataques reales (inyecciones SQL, XSS, accesos no autorizados, etc.).
---
## 2. Instalación
1. Descarga ZAP desde 👉 https://www.zaproxy.org/download/
2. Necesita **Java** (la versión Windows installer ya lo trae).
3. Instala y abre **OWASP ZAP**.
4. Al abrir, elige: *"No, no quiero persistir la sesión"* (para una prueba rápida).
---
## 3. Levanta tu sistema primero
Antes de escanear, tu app debe estar corriendo. En la carpeta del proyecto:
```bash
docker compose up -d
```

Verifica que responda:
- **Frontend:** http://localhost  (Nginx → Next.js)
- **Backend API:** http://localhost/api  (Nginx → NestJS)
- **Metabase:** http://localhost:3010

---

## 4. Escaneo AUTOMÁTICO (la forma más rápida)

1. En ZAP, arriba, pestaña **"Quick Start"** → **"Automated Scan"**
2. En **"URL to attack"** escribe tu dirección:
   - Frontend: `http://localhost`
   - Backend:  `http://localhost/api`
3. Deja marcado **"Use traditional spider"** y **"Use ajax spider"** (importante para SPA como Next.js)
4. Clic en **"Attack"**
5. Espera (5–15 min). ZAP hace **spider** (recorre el sitio) + **escaneo pasivo y activo**.

---

## 5. Escaneo MANUAL con proxy (más completo, recomendado para backend con login)

Para que ZAP vea las rutas protegidas (que requieren login), navega tu app A TRAVÉS de ZAP:

1. ZAP → botón **"Manual Explore"** (o Quick Start → Manual Explore)
2. URL: `http://localhost` → **"Launch Browser"** (abre un navegador con el proxy ya configurado)
3. **Usa tu app normalmente**: inicia sesión, registra un ingreso, crea un usuario, etc.
   - Así ZAP captura las peticiones autenticadas (con el JWT)
4. Vuelve a ZAP → en el árbol "Sites" verás todas las rutas capturadas
5. **Clic derecho en tu sitio → Attack → Active Scan** → lanza el escaneo activo sobre las rutas reales

---

## 6. Leer los resultados

En la pestaña inferior **"Alerts"** ZAP agrupa por nivel de riesgo:

| Nivel | Color | Significado |
|-------|-------|-------------|
| **High** | 🔴 Rojo | Vulnerabilidad crítica — corregir YA |
| **Medium** | 🟠 Naranja | Riesgo medio — corregir |
| **Low** | 🟡 Amarillo | Riesgo bajo |
| **Informational** | 🔵 Azul | Solo informativo |

Clic en cada alerta → te muestra: descripción, ruta afectada, riesgo y **solución recomendada**.

---

## 7. Exportar el reporte (para la tesis)

1. Menú **"Report"** → **"Generate Report"**
2. Formato: **HTML** (el más visual) o PDF
3. Guarda el archivo → de ahí sacas las capturas y los números para el documento.

---

## 8. Vulnerabilidades que SEGURO te van a salir (y cómo arreglarlas)

Tu stack (NestJS + Nginx) típicamente reporta estas. Te adelanto las soluciones:

### a) Falta Content-Security-Policy (CSP) — Medio
**Solución:** usa **Helmet** en NestJS. En `main.ts`:
```ts
import helmet from 'helmet';
app.use(helmet());
```

### b) Falta X-Frame-Options (Clickjacking) — Medio
**Solución:** Helmet ya lo agrega. O en `nginx.conf`:
```nginx
add_header X-Frame-Options "DENY";
```

### c) Falta X-Content-Type-Options — Bajo
**Solución:** Helmet lo agrega (`nosniff`). O en Nginx:
```nginx
add_header X-Content-Type-Options "nosniff";
```

### d) Server header revela versión (Nginx/Express) — Bajo
**Solución NestJS:** `app.disable('x-powered-by')` o con Helmet.
**Solución Nginx:** `server_tokens off;`

### e) Cookies sin HttpOnly/Secure — Medio
**Nota:** tu sistema usa **JWT en el header Authorization**, no cookies, así que probablemente no aplica. Si lo reporta, revisa que no estés enviando tokens en cookies.

### f) Directory Browsing / archivos ocultos (.env, .git) — Medio
**Solución Nginx:** bloquea rutas sensibles:
```nginx
location ~ /\.(env|git|hg) { deny all; return 404; }
```

---

## 9. PLANTILLA del documento (llénala con tus resultados reales)

---

### 3. Pruebas de Vulnerabilidad — OWASP ZAP

OWASP ZAP (Zed Attack Proxy) es una herramienta gratuita y de código abierto desarrollada por OWASP cuyo objetivo es identificar vulnerabilidades de seguridad en aplicaciones web. Funciona como proxy de interceptación entre el navegador y la aplicación, permitiendo analizar el tráfico HTTP/HTTPS en tiempo real mediante escaneo pasivo y activo.

En el proyecto **Sistema de Control Vehicular con OCR e IA – UAGRM**, OWASP ZAP fue utilizado como herramienta principal para evaluar la seguridad del backend (NestJS) y del frontend (Next.js).

#### Análisis del Backend
**URL analizada:** `http://localhost/api`

*[Figura X. Prueba de vulnerabilidad con OWASP ZAP en el backend.]*

**Resumen General del Escaneo del Backend**
- Total de alertas: ____
- Nivel Alto (High): ____
- Nivel Medio (Medium): ____
- Nivel Bajo (Low): ____
- Informativas: ____

**Principales Vulnerabilidades Detectadas**

| TIPO | DESCRIPCIÓN | RUTA AFECTADA | RIESGO | RECOMENDACIÓN |
|------|-------------|---------------|--------|---------------|
| Content Security Policy Header Not Set | Falta cabecera CSP | / | Medio | Agregar Helmet en NestJS |
| X-Frame-Options Header Not Set | Riesgo de Clickjacking | / | Medio | X-Frame-Options: DENY |
| X-Content-Type-Options Missing | Riesgo de MIME sniffing | / | Bajo | nosniff via Helmet |
| Server Leaks Version Info | Expone versión del servidor | / | Bajo | server_tokens off |
| ... | ... | ... | ... | ... |

#### Análisis del Frontend
**URL analizada:** `http://localhost`

*[Figura X. Escaneo automatizado con OWASP ZAP en el frontend.]*

**Resumen General del Frontend**
- Total de alertas: ____
- High: ____  | Medium: ____  | Low: ____  | Informativas: ____

**Conclusión:** No se detectaron vulnerabilidades críticas (High = 0), lo cual demuestra una buena base de seguridad. Las alertas de nivel medio/bajo corresponden principalmente a cabeceras HTTP de seguridad, las cuales fueron corregidas mediante la implementación de Helmet en el backend y la configuración de cabeceras en Nginx.

*Nota. Elaboración propia (2026).*

---

## 10. Resumen rápido (qué hacer ahora)

1. ✅ `docker compose up -d` (levanta tu app)
2. ✅ Instala y abre OWASP ZAP
3. ✅ Automated Scan → `http://localhost` y `http://localhost/api`
4. ✅ Manual Explore + login para rutas protegidas
5. ✅ Report → Generate Report (HTML)
6. ✅ Llena la plantilla con tus números reales y capturas
7. ✅ (Opcional pero recomendado) aplica Helmet para que la próxima corrida salga más limpia

---

*Nota. Elaboración propia (2026).*
