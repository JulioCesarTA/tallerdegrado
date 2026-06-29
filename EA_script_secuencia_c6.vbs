'==================================================================
' Script de Enterprise Architect (VBScript)
' DIAGRAMA DE SECUENCIA - CU06 Registrar Ingreso Vehicular con OCR
' Participantes reales del backend + tablas reales (Prisma models)
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

    Set oDiagram = oPackage.Diagrams.AddNew("CU06 - Secuencia Registrar Ingreso con OCR", "Sequence")
    oDiagram.Update
    oPackage.Diagrams.Refresh

    ' ---------- Participantes ----------
    Dim nombres(10)
    nombres(0)  = "Guardia"
    nombres(1)  = "IngresoView"
    nombres(2)  = "DetectionsController"
    nombres(3)  = "DetectionsService"
    nombres(4)  = "VisionService"
    nombres(5)  = "StorageService"
    nombres(6)  = "PuntoAcceso"
    nombres(7)  = "Vehiculo"
    nombres(8)  = "Sancion"
    nombres(9)  = "RegistroAcceso"
    nombres(10) = "Plaza"

    Dim els(10)
    Dim i
    For i = 0 To 10
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
    For i = 0 To 10
        Dim dobj
        Set dobj = oDiagram.DiagramObjects.AddNew("l=" & (30 + i * 150) & ";r=" & (110 + i * 150) & ";t=-15;b=-55", "")
        dobj.ElementID = els(i).ElementID
        dobj.Sequence = i + 1
        dobj.Update
    Next
    oDiagram.DiagramObjects.Refresh

    Dim n
    n = 0

    ' ===================== RECONOCIMIENTO DE PLACA (OCR) =====================
    n = n + 1 : AddMsg els(0), els(1), n, "capturar imagen del vehiculo"
    n = n + 1 : AddMsg els(1), els(2), n, "ocrFrame(image)"
    n = n + 1 : AddMsg els(2), els(3), n, "ocrFrame(file)"
    n = n + 1 : AddMsg els(3), els(4), n, "extractPlate(file)"
    n = n + 1 : AddMsg els(4), els(4), n, "DetectTextCommand (AWS Rekognition)"
    n = n + 1 : AddMsg els(4), els(3), n, "return({ plate, confidence })"
    n = n + 1 : AddMsg els(3), els(2), n, "return({ plate, confidence })"
    n = n + 1 : AddMsg els(2), els(1), n, "return({ plate, confidence })"
    n = n + 1 : AddMsg els(1), els(0), n, "muestra placa detectada"

    ' ===================== REGISTRO DE INGRESO =====================
    n = n + 1 : AddMsg els(0), els(1), n, "confirmar ingreso"
    n = n + 1 : AddMsg els(1), els(2), n, "registerEntry(dto, image)"
    n = n + 1 : AddMsg els(2), els(3), n, "registerEntry(dto, file)"
    n = n + 1 : AddMsg els(3), els(5), n, "saveImage(file)"
    n = n + 1 : AddMsg els(5), els(3), n, "return(evidenceUrl)"
    n = n + 1 : AddMsg els(3), els(6), n, "findFirst({ where: { camaraIngresoId } })"
    n = n + 1 : AddMsg els(6), els(3), n, "return(puntoAcceso)"
    n = n + 1 : AddMsg els(3), els(7), n, "upsert({ where: { placa } })"
    n = n + 1 : AddMsg els(7), els(3), n, "return(vehiculo)"
    n = n + 1 : AddMsg els(3), els(8), n, "findFirst({ where: { vehiculoId } })"
    n = n + 1 : AddMsg els(8), els(3), n, "return(activeSanction = null)"
    n = n + 1 : AddMsg els(3), els(9), n, "create({ estado: 'ingreso' })"
    n = n + 1 : AddMsg els(9), els(3), n, "return(registro)"
    n = n + 1 : AddMsg els(3), els(10), n, "update({ estado: 'ocupada' })"
    n = n + 1 : AddMsg els(10), els(3), n, "return(plaza)"
    n = n + 1 : AddMsg els(3), els(2), n, "return({ placa, evidenceUrl, vehicle, estado })"
    n = n + 1 : AddMsg els(2), els(1), n, "return(ingreso registrado)"
    n = n + 1 : AddMsg els(1), els(0), n, "muestra confirmacion"

    Repository.ReloadDiagram oDiagram.DiagramID
    Repository.OpenDiagram oDiagram.DiagramID

    Session.Prompt "Diagrama de Secuencia CU06 creado correctamente.", 0

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
