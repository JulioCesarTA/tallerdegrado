'==================================================================
' Script de Enterprise Architect (VBScript)
' Genera el DIAGRAMA DE CAPAS (Vista Logica)
' Sistema de Control Vehicular UAGRM
'
' 5 capas (Presentacion, Servicios, Negocio, Datos, Fuentes)
' + Aspectos Transversales (Cross-Cutting)
' Cada capa de negocio dividida en 4 modulos.
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

    ' ---------- Crear el diagrama (Package / Logical) ----------
    Set oDiagram = oPackage.Diagrams.AddNew("Diagrama de Capas - Control Vehicular", "Package")
    oDiagram.Update
    oPackage.Diagrams.Refresh

    ' =============================================================
    ' ACTORES / ENTRADAS
    ' =============================================================
    Dim pUsers, pExtSys
    Set pUsers  = CrearPaquete("Usuarios (Administrador / Guardia / Operador)", "", Nothing, 40,  20, 300, 70)
    Set pExtSys = CrearPaquete("Sistemas Externos (Camaras IP / Navegador)", "", Nothing, 400, 20, 300, 70)

    ' =============================================================
    ' CAPA DE PRESENTACION (Next.js)
    ' =============================================================
    Dim pPres, presA, presV, presS, presR
    Set pPres  = CrearPaquete("Capa de Presentacion (Next.js)", "layer", Nothing, 40, 120, 700, 120)
    Set presA  = CrearPaquete("Modulo de Administracion",        "", pPres, 55,  165, 150, 60)
    Set presV  = CrearPaquete("Modulo de Control Vehicular",     "", pPres, 220, 165, 150, 60)
    Set presS  = CrearPaquete("Modulo de Sanciones y Notif.",    "", pPres, 385, 165, 150, 60)
    Set presR  = CrearPaquete("Modulo de Reportes y Respaldo",   "", pPres, 550, 165, 150, 60)

    ' =============================================================
    ' CAPA DE SERVICIOS (API REST)
    ' =============================================================
    Dim pServ, servA, servV, servS, servR
    Set pServ  = CrearPaquete("Capa de Servicios (API REST)", "layer", Nothing, 40, 280, 700, 120)
    Set servA  = CrearPaquete("Modulo de Administracion (Controllers)",      "", pServ, 55,  325, 150, 60)
    Set servV  = CrearPaquete("Modulo de Control Vehicular (Controllers)",   "", pServ, 220, 325, 150, 60)
    Set servS  = CrearPaquete("Modulo de Sanciones y Notif. (Controllers)",  "", pServ, 385, 325, 150, 60)
    Set servR  = CrearPaquete("Modulo de Reportes y Respaldo (Controllers)", "", pServ, 550, 325, 150, 60)

    ' =============================================================
    ' CAPA DE NEGOCIO (NestJS Services)
    ' =============================================================
    Dim pBiz, bizA, bizV, bizS, bizR
    Set pBiz   = CrearPaquete("Capa de Negocio (NestJS)", "layer", Nothing, 40, 440, 700, 120)
    Set bizA   = CrearPaquete("Modulo de Administracion (Services)",      "", pBiz, 55,  485, 150, 60)
    Set bizV   = CrearPaquete("Modulo de Control Vehicular (Services)",   "", pBiz, 220, 485, 150, 60)
    Set bizS   = CrearPaquete("Modulo de Sanciones y Notif. (Services)",  "", pBiz, 385, 485, 150, 60)
    Set bizR   = CrearPaquete("Modulo de Reportes y Respaldo (Services)", "", pBiz, 550, 485, 150, 60)

    ' =============================================================
    ' CAPA DE DATOS
    ' =============================================================
    Dim pData, dAccess, dAgents
    Set pData   = CrearPaquete("Capa de Datos", "layer", Nothing, 40, 600, 700, 110)
    Set dAccess = CrearPaquete("Acceso a Datos (Prisma ORM)", "", pData, 70,  645, 280, 55)
    Set dAgents = CrearPaquete("Agentes de Servicio (Storage / Mail)", "", pData, 420, 645, 280, 55)

    ' =============================================================
    ' FUENTES DE DATOS / SERVICIOS EXTERNOS
    ' =============================================================
    Dim pSources, pExtSrv
    Set pSources = CrearPaquete("Fuentes de Datos (PostgreSQL)", "", Nothing, 40,  750, 320, 70)
    Set pExtSrv  = CrearPaquete("Servicios Externos (Claude AI / AWS Rekognition / SMTP)", "", Nothing, 400, 750, 340, 70)

    ' =============================================================
    ' ASPECTOS TRANSVERSALES (Cross-Cutting)
    ' =============================================================
    Dim pCross, cSec, cOps, cCom
    Set pCross = CrearPaquete("Aspectos Transversales", "layer", Nothing, 820, 120, 280, 440)
    Set cSec   = CrearPaquete("Seguridad (JWT / bcrypt / Guards)", "", pCross, 835, 170, 250, 90)
    Set cOps   = CrearPaquete("Gestion Operacional (Logging / Alertas)", "", pCross, 835, 290, 250, 90)
    Set cCom   = CrearPaquete("Comunicacion (WebSockets / Streaming)", "", pCross, 835, 410, 250, 90)

    oPackage.Elements.Refresh
    oDiagram.DiagramObjects.Refresh

    ' =============================================================
    ' RELACIONES VERTICALES (Dependency)
    ' =============================================================
    Conectar pUsers,  pPres, "entra"
    Conectar pExtSys, pServ, "entra"

    Conectar presA, servA, ""
    Conectar presV, servV, ""
    Conectar presS, servS, ""
    Conectar presR, servR, ""

    Conectar servA, bizA, ""
    Conectar servV, bizV, ""
    Conectar servS, bizS, ""
    Conectar servR, bizR, ""

    Conectar bizA, pData, ""
    Conectar bizV, pData, ""
    Conectar bizS, pData, ""
    Conectar bizR, pData, ""

    Conectar dAccess, pSources, ""
    Conectar dAgents, pExtSrv,  ""
    Conectar bizV,    pExtSrv,  "OCR / IA"

    ' =============================================================
    ' RELACIONES TRANSVERSALES
    ' =============================================================
    Conectar pPres, pCross, ""
    Conectar pServ, pCross, ""
    Conectar pBiz,  pCross, ""
    Conectar pData, pCross, ""

    Repository.ReloadDiagram oDiagram.DiagramID
    Repository.OpenDiagram oDiagram.DiagramID

    Session.Prompt "Diagrama de Capas creado correctamente.", 0

End Sub

'------------------------------------------------------------------
' Crea un PAQUETE (Package) opcionalmente anidado y lo coloca
'------------------------------------------------------------------
Function CrearPaquete(sNombre, sEstereotipo, oParent, x, y, w, h)
    ' Nota: los Package en EA no aceptan ParentID (usan PackageID).
    ' El anidamiento se logra de forma VISUAL por las coordenadas.
    Dim el
    Set el = oPackage.Elements.AddNew(sNombre, "Package")
    If sEstereotipo <> "" Then el.Stereotype = sEstereotipo
    el.Update

    Dim dobj
    Set dobj = oDiagram.DiagramObjects.AddNew("l=" & x & ";r=" & (x + w) & ";t=" & y & ";b=" & (y + h), "")
    dobj.ElementID = el.ElementID
    dobj.Update

    Set CrearPaquete = el
End Function

'------------------------------------------------------------------
' Crea una dependencia entre dos paquetes
'------------------------------------------------------------------
Sub Conectar(oOrigen, oDestino, sNombre)
    Dim con
    Set con = oOrigen.Connectors.AddNew(sNombre, "Dependency")
    con.SupplierID = oDestino.ElementID
    con.Update
    oOrigen.Connectors.Refresh
End Sub

Main
