'==================================================================
' Script de Enterprise Architect (VBScript)
' DIAGRAMA DE SECUENCIA - CU08 Analizar Caracteristicas con IA
' Participantes reales del backend (Claude API = api.anthropic.com)
'
' NOTA: el fragmento 'par' (Promise.all) se agrega a mano
'       (EA no permite crear fragmentos por script).
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

    Set oDiagram = oPackage.Diagrams.AddNew("CU08 - Secuencia Analizar con IA", "Sequence")
    oDiagram.Update
    oPackage.Diagrams.Refresh

    ' ---------- Participantes ----------
    Dim nombres(6)
    nombres(0) = "Guardia"
    nombres(1) = "AnalisisView"
    nombres(2) = "DetectionsController"
    nombres(3) = "DetectionsService"
    nombres(4) = "VisionService"
    nombres(5) = "ClaudeAPI"
    nombres(6) = "StorageService"

    Dim els(6)
    Dim i
    For i = 0 To 6
        Dim el
        If i = 0 Then
            Set el = oPackage.Elements.AddNew(nombres(i), "Actor")
        Else
            Set el = oPackage.Elements.AddNew(nombres(i), "Sequence")
        End If
        el.Update
        Set els(i) = el
    Next
    oPackage.Elements.Refresh

    ' ---------- Colocar participantes (compacto) ----------
    For i = 0 To 6
        Dim dobj
        Set dobj = oDiagram.DiagramObjects.AddNew("l=" & (30 + i * 155) & ";r=" & (120 + i * 155) & ";t=-15;b=-55", "")
        dobj.ElementID = els(i).ElementID
        dobj.Sequence = i + 1
        dobj.Update
    Next
    oDiagram.DiagramObjects.Refresh

    Dim n
    n = 0

    ' ===================== ANALIZAR CON IA =====================
    n = n + 1 : AddMsg els(0), els(1), n, "capturar imagen del vehiculo"
    n = n + 1 : AddMsg els(1), els(2), n, "analyzeVehicle(image)"
    n = n + 1 : AddMsg els(2), els(3), n, "analyzeVehicleFile(file)"

    ' === par Promise.all - rama 1 (analisis IA) -> ENVOLVER A MANO ===
    n = n + 1 : AddMsg els(3), els(4), n, "analyzeVehicle(file)"
    n = n + 1 : AddMsg els(4), els(5), n, "POST /v1/messages (api.anthropic.com)"
    n = n + 1 : AddMsg els(5), els(4), n, "return(JSON tipoVehiculo, marca, modelo, color, caracteristicas)"
    n = n + 1 : AddMsg els(4), els(3), n, "return(analysis)"

    ' === par - rama 2 (guardado en S3) ===
    n = n + 1 : AddMsg els(3), els(6), n, "saveImage(file)"
    n = n + 1 : AddMsg els(6), els(3), n, "return(evidenceUrl)"

    n = n + 1 : AddMsg els(3), els(2), n, "return({ ...analysis, evidenceUrl })"
    n = n + 1 : AddMsg els(2), els(1), n, "return(analisis del vehiculo)"
    n = n + 1 : AddMsg els(1), els(0), n, "muestra caracteristicas detectadas"

    Repository.ReloadDiagram oDiagram.DiagramID
    Repository.OpenDiagram oDiagram.DiagramID

    Session.Prompt "Diagrama de Secuencia CU08 creado." & vbCrLf & _
                   "Agrega el fragmento 'par' a mano sobre las 2 ramas.", 0

End Sub

Sub AddMsg(oOrigen, oDestino, nNum, sTexto)
    Dim con
    Set con = oOrigen.Connectors.AddNew(sTexto, "Sequence")
    con.SupplierID = oDestino.ElementID
    con.SequenceNo = nNum
    con.Update
    oOrigen.Connectors.Refresh
End Sub

Main
