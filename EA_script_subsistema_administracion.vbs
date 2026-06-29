'==================================================================
' Script de Enterprise Architect (VBScript)
' DIAGRAMA DE COMPONENTES - Subsistema de Administracion
' 3 paquetes: Administracion (Cliente) -> Servidor -> Base de Datos
' Patron por entidad: Form -> Controller <|.. Service -- Model
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

    Set oDiagram = oPackage.Diagrams.AddNew("Subsistema de Administracion", "Component")
    oDiagram.Update
    oPackage.Diagrams.Refresh

    ' ---------- Paquetes (cajas de fondo) ----------
    Dim pCliente, pServidor, pBD
    Set pCliente  = CrearElem("Administracion (Cliente)", "Package", "", 20,  20,  900, 110)
    Set pServidor = CrearElem("Servidor",                 "Package", "", 20,  160, 900, 320)
    Set pBD       = CrearElem("Base de Datos",            "Package", "", 20,  520, 900, 110)

    ' ---------- Entidades ----------
    Dim entidades(4)
    entidades(0) = "Usuario"
    entidades(1) = "Camara"
    entidades(2) = "PuntoAcceso"
    entidades(3) = "Parqueo"
    entidades(4) = "Plaza"

    Dim forms(4), ctrls(4), svcs(4), mdls(4)
    Dim i, x

    For i = 0 To 4
        x = 40 + i * 172
        ' Formularios (Cliente)
        Set forms(i) = CrearElem(entidades(i) & "Form",       "Component", "",      x, 55,  150, 50)
        ' Controllers (Servidor)
        Set ctrls(i) = CrearElem(entidades(i) & "Controller", "Component", "class", x, 195, 150, 50)
        ' Services (Servidor)
        Set svcs(i)  = CrearElem(entidades(i) & "Service",    "Component", "class", x, 300, 150, 50)
        ' Models (Servidor)
        Set mdls(i)  = CrearElem(entidades(i) & "Model",      "Component", "class", x, 405, 150, 50)
    Next

    ' ---------- Base de Datos ----------
    Dim oScript
    Set oScript = CrearElem("bd_control_vehicular", "Component", "script", 40, 555, 150, 50)

    Dim tablas(4)
    tablas(0) = "usuario"
    tablas(1) = "camara"
    tablas(2) = "punto_acceso"
    tablas(3) = "parqueo"
    tablas(4) = "plaza"

    Dim tabEls(4)
    For i = 0 To 4
        x = 210 + i * 145
        Set tabEls(i) = CrearElem(tablas(i), "Component", "table", x, 555, 135, 50)
    Next

    oPackage.Elements.Refresh
    oDiagram.DiagramObjects.Refresh

    ' ---------- Relaciones ----------
    ' Service realiza al Controller, y se asocia con su Model
    For i = 0 To 4
        Conectar svcs(i), ctrls(i), "Realization", ""
        Conectar svcs(i), mdls(i),  "Association",  ""
    Next

    ' Cliente -> Servidor (JSON/HTTPS) ; Servidor -> BD
    Conectar pCliente,  pServidor, "Dependency", "JSON/HTTPS"
    Conectar pServidor, pBD,       "Dependency", ""

    Repository.ReloadDiagram oDiagram.DiagramID
    Repository.OpenDiagram oDiagram.DiagramID

    Session.Prompt "Diagrama de Componentes (Subsistema Administracion) creado.", 0

End Sub

'------------------------------------------------------------------
' Crea un elemento, le pone estereotipo y lo coloca en el diagrama
'------------------------------------------------------------------
Function CrearElem(sNombre, sTipo, sEstereotipo, x, y, w, h)
    Dim el
    Set el = oPackage.Elements.AddNew(sNombre, sTipo)
    If sEstereotipo <> "" Then el.Stereotype = sEstereotipo
    el.Update

    Dim dobj
    Set dobj = oDiagram.DiagramObjects.AddNew("l=" & x & ";r=" & (x + w) & ";t=" & y & ";b=" & (y + h), "")
    dobj.ElementID = el.ElementID
    dobj.Update

    Set CrearElem = el
End Function

'------------------------------------------------------------------
' Crea un conector entre dos elementos
'------------------------------------------------------------------
Sub Conectar(oOrigen, oDestino, sTipo, sNombre)
    Dim con
    Set con = oOrigen.Connectors.AddNew(sNombre, sTipo)
    con.SupplierID = oDestino.ElementID
    con.Update
    oOrigen.Connectors.Refresh
End Sub

Main
