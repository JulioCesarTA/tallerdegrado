# Guía de Defensa — Diagrama de Despliegue (UML 2.5)
### Sistema de Control Vehicular UAGRM

> Esta guía te explica **qué es cada elemento, por qué lo usaste y cómo responder** si el tribunal te pregunta. Léela hasta entenderla; al final hay un guion de defensa y preguntas trampa.

---

## 1. ¿Qué es un Diagrama de Despliegue y para qué sirve?

Es un diagrama de la UML que muestra **la arquitectura física** del sistema: en qué máquinas (hardware) corre el software, cómo se distribuye y cómo se comunican las partes por la red.

**Frase para defender:**
> "El diagrama de despliegue representa la vista física de la arquitectura: muestra los nodos de hardware, los entornos de ejecución, los artefactos de software desplegados y las rutas de comunicación entre ellos."

A diferencia del **diagrama de capas** (que es lógico, muestra *cómo está organizado el código*), el de despliegue es **físico**: muestra *dónde se ejecuta realmente*.

---

## 2. Los 4 elementos de UML 2.5 que usaste (esto es lo MÁS importante)

El tribunal va a preguntar "¿por qué esto es un artifact y esto un node?". Aquí está la regla:

### 🔷 `<<device>>` — Nodo de Hardware Físico
Es una **máquina física** o recurso de hardware: un servidor, una PC, un router, una cámara, un disco de almacenamiento.

**En tu diagrama:**
- Estación Cliente (PC/Laptop)
- Cámaras IP
- Servidor DNS
- Router / Firewall
- Servidor de Aplicación AWS EC2
- AWS S3 (almacenamiento físico)
- Docker Volumes (postgres_data, metabase-data) ← almacenamiento persistente

**Cómo defenderlo:**
> "Un `<<device>>` es un recurso computacional físico. El EC2 es una máquina virtual que para efectos del despliegue actúa como hardware; las cámaras, el router y los volúmenes Docker son recursos físicos de almacenamiento o red."

---

### 🔶 `<<executionEnvironment>>` — Entorno de Ejecución
Es un **software que ejecuta a otro software**. No es hardware, es una plataforma/runtime que aloja artefactos: un navegador, Node.js, el motor Docker, o un servicio en la nube.

**En tu diagrama:**
- Navegador Web (ejecuta la SPA)
- Docker Engine (ejecuta los contenedores)
- AWS Rekognition (servicio externo)
- Anthropic Cloud / Claude (servicio externo)
- Gmail SMTP (servicio externo)

**Cómo defenderlo:**
> "Un `<<executionEnvironment>>` es un entorno de software que provee servicios de ejecución a los artefactos que contiene. Por ejemplo, el Docker Engine es el entorno que ejecuta mis contenedores, y el navegador es el entorno que ejecuta mi aplicación Next.js del lado cliente."

**¿Por qué los servicios externos (Rekognition, Claude, Gmail) son executionEnvironment y NO device?**
> "Porque no controlo su hardware ni sé en qué máquina corren. Solo sé que son entornos de ejecución en la nube que exponen un servicio. Por eso los modelo como `<<executionEnvironment>>` vacíos y me conecto a ellos por una dependencia etiquetada con el protocolo (HTTPS/REST)."

---

### 🟩 `<<container>>` — Contenedor Docker
Es un estereotipo que usé para representar cada **contenedor Docker**. Técnicamente es un tipo de entorno de ejecución aislado.

**En tu diagrama (5 contenedores):**
| Contenedor | Imagen | Puerto |
|-----------|--------|--------|
| `cv_nginx` | nginx:1.27-alpine | 80 |
| `cv_frontend` | node:22-alpine | 3000 |
| `cv_backend` | node:22-alpine | 3001 |
| `cv_postgres` | postgres:16-alpine | 5432 |
| `metabase` | metabase:latest | 3010 |

**Cómo defenderlo:**
> "Cada servicio corre en su propio contenedor Docker, siguiendo el principio de 'un proceso por contenedor'. Esto da aislamiento, escalabilidad y reinicio independiente. Todos corren sobre el mismo Docker Engine en el EC2, conectados por una red bridge interna llamada app-network."

---

### 🟨 `<<artifact>>` — Artefacto (ARCHIVO FÍSICO)
**Esta es la pregunta estrella del tribunal.** Un artifact es un **archivo físico concreto**: el resultado de compilar/empaquetar el software. Ejemplos clásicos: `.jar`, `.war`, `.exe`, `.dll`, un build, un archivo de configuración, una imagen guardada.

**REGLA DE ORO:**
> Si lo puedo **copiar como archivo**, es un artifact. Si es un **servicio/proceso corriendo**, NO es artifact (es execution environment o node).

**En tu diagrama, qué SÍ es artifact y por qué:**
| Artefacto | Por qué es artifact |
|-----------|---------------------|
| Aplicación Frontend (Next.js) | Es el build compilado del frontend (archivos `.next`) |
| Axios HTTP Client | Librería empaquetada dentro del build del frontend |
| Cliente WebSocket | Parte del build del frontend |
| Backend API (NestJS) | El código compilado (`dist/`) que se ejecuta |
| WebSocket Gateway, Vision, Mail, Prisma | Módulos compilados dentro del backend |
| Evidencias y Backups en S3 | Archivos físicos reales (imágenes `.jpg`, dumps de BD) |
| docker-compose.yml, .env, nginx.conf, entrypoint.sh | Archivos de configuración (deployment specs) |

**Cómo defenderlo:**
> "Modelo como artefactos únicamente los archivos físicos desplegables: los builds compilados del frontend y backend, los archivos almacenados en S3, y los archivos de configuración del despliegue. No modelo las APIs externas como artefactos porque una API es una interfaz/servicio, no un archivo físico."

---

## 3. `<<deployment spec>>` — Especificación de Despliegue (el detalle PRO)

Esto es lo que te sube la nota. Una **Deployment Specification** en UML 2.5 es un artefacto especial que **define los parámetros de ejecución/configuración** de cómo se despliega algo.

**En tu diagrama:**
| Deployment Spec | Qué configura |
|-----------------|---------------|
| `docker-compose.yml` | Orquesta y define todos los contenedores |
| `.env` | Variables de entorno (claves AWS, JWT, Claude, BD) |
| `nginx.conf` | Configuración del reverse proxy |
| `entrypoint.sh` | Ejecuta migraciones de Prisma al arrancar el backend |

**Cómo defenderlo:**
> "Una Deployment Specification es un artefacto que especifica los parámetros de despliegue. En mi caso, el docker-compose.yml especifica cómo se construyen y conectan los contenedores; el .env define las variables de entorno; el nginx.conf configura el enrutamiento; y el entrypoint.sh ejecuta las migraciones. Las represento con la relación `<<deploy>>` apuntando al elemento que configuran."

---

## 4. Relaciones / Rutas de Comunicación

Las líneas del diagrama también tienen significado:

- **Línea sólida (`--`)** = **Communication Path** (ruta de comunicación física entre nodos). Ej: Cliente — Router — EC2.
- **Línea punteada con flecha (`..>`)** = **Dependencia**. La uso con estereotipos:
  - `<<protocol>>` → indica el protocolo de comunicación (HTTP/HTTPS, SQL, WebSocket, SMTP, etc.)
  - `<<deploy>>` → un deployment spec configura/despliega un elemento
  - `<<use>>` → un artefacto usa a otro
  - `<<persist>>` → un contenedor persiste datos en un volumen

**Cómo defenderlo:**
> "Las líneas sólidas son rutas de comunicación entre nodos físicos. Las dependencias punteadas las etiqueto con el protocolo concreto para que se entienda cómo viaja la información: REST sobre HTTPS hacia las APIs, SQL por TCP hacia PostgreSQL, WebSocket para el streaming en tiempo real y SMTP para los correos."

---

## 5. El FLUJO completo (cuéntalo como una historia)

Así explicas el diagrama de corrido en la defensa:

> "El usuario abre el navegador y solicita el dominio. **(1)** El navegador consulta el **DNS** para resolver la dirección. **(2)** La petición pasa por el **Router/Firewall** que la dirige al **servidor EC2**. **(3)** Dentro del EC2 corre el **Docker Engine** con 5 contenedores. El único expuesto a internet es **Nginx** (puerto 80), que actúa como reverse proxy: las rutas `/` van al **frontend Next.js** y las `/api` al **backend NestJS**. **(4)** El frontend, ya cargado en el navegador, hace peticiones REST vía **Axios** y abre un **WebSocket** para el monitoreo en tiempo real. **(5)** El backend accede a los datos con **Prisma** hacia el contenedor **PostgreSQL**. **(6)** Para las funciones de IA, el módulo de visión llama por HTTPS a **AWS Rekognition** (OCR de placas) y a **Claude** (análisis del vehículo). **(7)** Las evidencias fotográficas y los respaldos se guardan en **AWS S3**. **(8)** Las notificaciones de recuperación de contraseña salen por **Gmail SMTP**. **(9)** **Metabase** lee directamente de PostgreSQL para los dashboards de BI. Todo el despliegue está definido por el **docker-compose.yml** y configurado con las variables del **.env**."

---

## 6. Decisiones de arquitectura (por si preguntan "¿por qué así?")

| Decisión | Justificación |
|----------|---------------|
| **Multi-contenedor** (no monolito) | Aislamiento, escalabilidad y reinicio independiente de cada servicio |
| **Nginx como único puerto expuesto** | Seguridad: los demás contenedores no son accesibles desde internet, solo por la red interna |
| **PostgreSQL en contenedor** | Simplicidad y costo; los datos persisten en un volumen Docker aunque el contenedor se reinicie |
| **Volúmenes Docker** | Persistencia de datos independiente del ciclo de vida del contenedor |
| **Servicios de IA externos** (Rekognition/Claude) | No reinventar OCR ni visión por computadora; usar servicios probados vía API |
| **S3 para evidencias** | Almacenamiento de archivos escalable y económico, separado de la BD |

---

## 7. Preguntas TRAMPA del tribunal y cómo responder

**P: "¿Por qué Claude es un executionEnvironment y no un device?"**
> R: Porque es un servicio en la nube; no controlo ni conozco su hardware. Solo consumo su API por HTTPS. Modelar el hardware de un tercero sería incorrecto.

**P: "¿Por qué la API de Rekognition no es un artifact?"**
> R: Porque un artifact es un archivo físico desplegable. Una API es una interfaz/servicio, no un archivo. Por eso el nodo está vacío y me conecto por una dependencia con el protocolo.

**P: "¿Por qué el volumen Docker es un device y no un artifact?"**
> R: Porque representa almacenamiento físico persistente, no un archivo empaquetado. En UML lo correcto es modelar el almacenamiento como un nodo, no como artefacto.

**P: "¿Todo corre en un solo contenedor?"**
> R: No. Son 5 contenedores independientes en el mismo EC2, orquestados por docker-compose y conectados por una red bridge interna.

**P: "¿Qué diferencia hay entre este diagrama y el de capas?"**
> R: El de capas es la vista **lógica** (organización del código en capas). Este es la vista **física** (dónde y cómo se ejecuta realmente el software).

**P: "¿Qué es el entrypoint.sh?"**
> R: Es un deployment spec: un script que, al arrancar el contenedor backend, ejecuta las migraciones de Prisma sobre la BD antes de levantar el servidor.

**P: "¿Por qué docker-compose es un deployment spec y no un artifact normal?"**
> R: Porque su función específica es **especificar cómo se despliega** el sistema (qué contenedores, con qué imágenes, puertos, redes y variables). Esa es la definición exacta de Deployment Specification en UML 2.5.

---

## 8. Resumen de 30 segundos (memorízalo)

> "Es la vista física del sistema. Tengo nodos `<<device>>` para el hardware (EC2, router, cámaras, S3, volúmenes), entornos `<<executionEnvironment>>` para los runtimes y servicios externos (Docker, navegador, Claude, Rekognition, Gmail), cinco contenedores Docker `<<container>>`, y artefactos `<<artifact>>` solo para los archivos físicos: los builds compilados, los archivos en S3 y las configuraciones. Las configuraciones de despliegue (docker-compose, .env, nginx.conf, entrypoint.sh) son Deployment Specifications. Las comunicaciones están etiquetadas con su protocolo real."

---

*Nota. Elaboración propia (2026).*
