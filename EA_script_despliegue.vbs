'==================================================================
' Script de Enterprise Architect (VBScript)
' Genera el DIAGRAMA DE DESPLIEGUE (UML 2.5)
' Sistema de Control Vehicular UAGRM
'
' Incluye:
'   - Nodos <<device>>            (hardware fisico)
'   - Nodos <<executionEnvironment>> (runtimes / servicios nube)
'   - Nodos <<container>>          (contenedores Docker)
'   - Artefactos <<artifact>>      (software desplegado, archivos S3)
'   - Deployment Specs <<deployment spec>> (compose, env, nginx, entrypoint)
'   - Rutas de comunicacion con protocolos
'
' USO:
' 1. Scripting -> Scripts -> tu grupo -> New VBScript
' 2. Pega TODO y Save Script
' 3. En el Browser SELECCIONA el paquete destino
' 4. Clic derecho sobre el script -> Run Script
'==================================================================

option explicit

!INC Local Scripts.EAConstants-VBScript

Dim oDiagram
Dim oPackage

Sub Main

    Set oPackage = Repository.GetTreeSelectedPackage()
    If oPackage Is Nothing Then
        Session.Prompt "Selecciona primero un paquete en el Browser.", 0
        Exit Sub
    End If

    ' ---------- Crear el diagrama de Despliegue ----------
    Set oDiagram = oPackage.Diagrams.AddNew("Diagrama de Despliegue - Control Vehicular", "Deployment")
    oDiagram.Update
    oPackage.Diagrams.Refresh

    ' =============================================================
    ' NODOS PRINCIPALES (device)
    ' =============================================================
    Dim nCliente, nCamaras, nDNS, nRouter, nEC2, nS3, nVolPg, nVolMeta

    Set nCliente = CrearNodo("Estacion Cliente (PC / Laptop)", "device", Nothing, 30, 40, 220, 200)
    Set nCamaras = CrearNodo("Camaras IP (Ingreso / Salida)", "device", Nothing, 30, 300, 220, 90)
    Set nDNS     = CrearNodo("Servidor DNS", "device", Nothing, 30, 440, 220, 90)
    Set nRouter  = CrearNodo("Router / Firewall (Gateway)", "device", Nothing, 320, 300, 220, 90)
    Set nEC2     = CrearNodo("Servidor de Aplicacion - AWS EC2 (Linux)", "device", Nothing, 320, 40, 620, 230)
    Set nS3      = CrearNodo("AWS S3 (bucket: proyectodegrado1)", "device", Nothing, 1010, 300, 250, 120)
    Set nVolPg   = CrearNodo("Docker Volume: postgres_data", "device", Nothing, 320, 560, 230, 70)
    Set nVolMeta = CrearNodo("Docker Volume: metabase-data", "device", Nothing, 580, 560, 230, 70)

    ' =============================================================
    ' ENTORNOS DE EJECUCION (executionEnvironment)
    ' =============================================================
    Dim eeBrowser, eeDocker, eeRekog, eeClaude, eeSMTP

    ' Navegador dentro del Cliente
    Set eeBrowser = CrearNodo("Navegador Web (Chrome / Edge)", "executionEnvironment", nCliente, 45, 90, 190, 130)

    ' Docker Engine dentro del EC2
    Set eeDocker  = CrearNodo("Docker Engine", "executionEnvironment", nEC2, 335, 90, 590, 160)

    ' Servicios externos en la nube
    Set eeRekog   = CrearNodo("AWS Rekognition (us-east-2) - DetectText API (OCR)", "executionEnvironment", Nothing, 1010, 40, 250, 70)
    Set eeClaude  = CrearNodo("Anthropic Cloud - Claude API (claude-haiku-4-5)", "executionEnvironment", Nothing, 1010, 140, 250, 70)
    Set eeSMTP    = CrearNodo("Gmail SMTP - Servicio de Correo", "executionEnvironment", Nothing, 1010, 460, 250, 70)

    ' =============================================================
    ' CONTENEDORES DOCKER (container) dentro del Docker Engine
    ' =============================================================
    Dim cNginx, cFront, cBack, cPg, cMeta

    Set cNginx = CrearNodo("cv_nginx [nginx:1.27-alpine] :80", "container", eeDocker, 345, 130, 160, 50)
    Set cFront = CrearNodo("cv_frontend [node:22-alpine] :3000", "container", eeDocker, 520, 130, 160, 50)
    Set cBack  = CrearNodo("cv_backend [node:22-alpine] :3001", "container", eeDocker, 695, 130, 160, 50)
    Set cPg    = CrearNodo("cv_postgres [postgres:16-alpine] :5432", "container", eeDocker, 345, 195, 160, 50)
    Set cMeta  = CrearNodo("metabase [metabase:latest] :3010", "container", eeDocker, 520, 195, 160, 50)

    ' =============================================================
    ' ARTEFACTOS (artifact) dentro de sus contenedores / nodos
    ' =============================================================
    Dim aWebApp, aAxios, aWs, aNginxApp, aNext, aBackend, aWsGw, aVision, aPrisma
    Dim aEvidencias, aBackups

    ' Cliente / navegador
    Set aWebApp = CrearArtefacto("Aplicacion Web (Next.js SPA)", "", eeBrowser)
    Set aAxios  = CrearArtefacto("Axios HTTP Client", "", eeBrowser)
    Set aWs     = CrearArtefacto("Cliente WebSocket", "", eeBrowser)

    ' Contenedores
    Set aNginxApp = CrearArtefacto("Reverse Proxy", "", cNginx)
    Set aNext     = CrearArtefacto("Aplicacion Frontend (Next.js)", "", cFront)
    Set aBackend  = CrearArtefacto("Backend API (NestJS - REST)", "", cBack)
    Set aWsGw     = CrearArtefacto("WebSocket Gateway (streaming.gateway)", "", cBack)
    Set aVision   = CrearArtefacto("Modulo de Vision (vision.service)", "", cBack)
    Set aPrisma   = CrearArtefacto("Prisma ORM Client", "", cBack)

    ' S3 (archivos fisicos reales)
    Set aEvidencias = CrearArtefacto("Evidencias Fotograficas (prefix: evidences)", "", nS3)
    Set aBackups    = CrearArtefacto("Respaldos de BD (prefix: backups)", "", nS3)

    ' Base de datos dentro del contenedor postgres
    Dim aDB
    Set aDB = CrearArtefacto("control_vehicular (Esquema BD)", "", cPg)

    ' =============================================================
    ' DEPLOYMENT SPECIFICATIONS (deployment spec)
    ' =============================================================
    Dim dCompose, dEnv, dNginxConf, dEntrypoint

    Set dCompose    = CrearArtefacto("docker-compose.yml", "deployment spec", nEC2)
    Set dEnv        = CrearArtefacto(".env (variables de entorno)", "deployment spec", nEC2)
    Set dNginxConf  = CrearArtefacto("nginx.conf", "deployment spec", cNginx)
    Set dEntrypoint = CrearArtefacto("entrypoint.sh (migraciones)", "deployment spec", cBack)

    oPackage.Elements.Refresh
    oDiagram.DiagramObjects.Refresh

    ' =============================================================
    ' RUTAS DE COMUNICACION (Communication Paths) y DEPENDENCIAS
    ' =============================================================
    ' Red
    Conectar nCliente, nDNS,    "Association", "DNS query"
    Conectar nCliente, nRouter, "Association", "HTTP/HTTPS"
    Conectar nCamaras, nRouter, "Association", "RTSP / HTTP"
    Conectar nRouter,  nEC2,    "Association", "HTTP/HTTPS (80/443)"

    ' Nginx -> frontend / backend
    Conectar aNginxApp, aNext,    "Dependency", "proxy /"
    Conectar aNginxApp, aBackend, "Dependency", "proxy /api"
    Conectar aAxios,    aNginxApp,"Dependency", "HTTPS / REST (JSON)"
    Conectar aWs,       aWsGw,    "Dependency", "WebSocket (WSS)"

    ' Backend -> datos
    Conectar aBackend, aPrisma, "Dependency", "use"
    Conectar aPrisma,  aDB,     "Dependency", "SQL (TCP 5432)"
    Conectar cMeta,    cPg,     "Dependency", "SQL (lectura BI)"

    ' Backend -> servicios externos
    Conectar aBackend, nS3,      "Dependency", "HTTPS / AWS SDK (evidencias + backups)"
    Conectar aVision,  eeRekog,  "Dependency", "HTTPS / AWS SDK (OCR)"
    Conectar aVision,  eeClaude, "Dependency", "HTTPS / REST (analisis IA)"
    Conectar aBackend, eeSMTP,   "Dependency", "SMTP (TLS 587)"

    ' Deployment specs
    Conectar dCompose,    eeDocker,  "Dependency", "deploy"
    Conectar dEnv,        cBack,     "Dependency", "deploy"
    Conectar dNginxConf,  aNginxApp, "Dependency", "deploy"
    Conectar dEntrypoint, aBackend,  "Dependency", "deploy"

    ' Volumenes
    Conectar cPg,   nVolPg,   "Dependency", "persist"
    Conectar cMeta, nVolMeta, "Dependency", "persist"

    Repository.ReloadDiagram oDiagram.DiagramID
    Repository.OpenDiagram oDiagram.DiagramID

    Session.Prompt "Diagrama de Despliegue creado correctamente.", 0

End Sub

'------------------------------------------------------------------
' Crea un NODO (Node) con estereotipo, opcionalmente anidado
'------------------------------------------------------------------
Function CrearNodo(sNombre, sEstereotipo, oParent, x, y, w, h)
    Dim el
    Set el = oPackage.Elements.AddNew(sNombre, "Node")
    If sEstereotipo <> "" Then el.Stereotype = sEstereotipo
    If Not (oParent Is Nothing) Then el.ParentID = oParent.ElementID
    el.Update

    Dim dobj
    Set dobj = oDiagram.DiagramObjects.AddNew("l=" & x & ";r=" & (x + w) & ";t=" & y & ";b=" & (y + h), "")
    dobj.ElementID = el.ElementID
    dobj.Update

    Set CrearNodo = el
End Function

'------------------------------------------------------------------
' Crea un ARTEFACTO (Artifact), opcionalmente anidado
'------------------------------------------------------------------
Function CrearArtefacto(sNombre, sEstereotipo, oParent)
    Dim el
    Set el = oPackage.Elements.AddNew(sNombre, "Artifact")
    If sEstereotipo <> "" Then el.Stereotype = sEstereotipo
    If Not (oParent Is Nothing) Then el.ParentID = oParent.ElementID
    el.Update

    ' Posicion automatica (EA reubica los anidados al hacer layout)
    Dim dobj
    Set dobj = oDiagram.DiagramObjects.AddNew("l=0;r=120;t=0;b=50", "")
    dobj.ElementID = el.ElementID
    dobj.Update

    Set CrearArtefacto = el
End Function

'------------------------------------------------------------------
' Crea un conector entre dos elementos
'------------------------------------------------------------------
Sub Conectar(oOrigen, oDestino, sTipo, sNombre)
    Dim con
    Set con = oOrigen.Connectors.AddNew(sNombre, sTipo)
    con.SupplierID = oDestino.ElementID
    If sTipo = "Dependency" And (sNombre = "deploy" Or sNombre = "persist" Or sNombre = "use") Then
        con.Stereotype = sNombre
    End If
    con.Update
    oOrigen.Connectors.Refresh
End Sub

Main
