'==============================================================
' Script de Enterprise Architect (VBScript)
' Genera AUTOMATICAMENTE el Diagrama de Secuencia - CU01 Iniciar Sesion
'
' COMO USARLO:
' 1. En EA abre la ventana Scripting:
'    Ribbon "Specialize" -> "Tools" -> "Scripting"
'    (o menu Develop -> Scripting, segun version)
' 2. Clic derecho en un grupo de scripts -> "New VBScript"
' 3. Borra el contenido y pega TODO este archivo
' 4. En el Browser, SELECCIONA el paquete donde quieres el diagrama
' 5. Clic derecho sobre el script -> "Run Script"
'==============================================================

option explicit

!INC Local Scripts.EAConstants-VBScript

Sub Main

    Dim pkg As EA.Package
    Set pkg = Repository.GetTreeSelectedPackage()

    If pkg Is Nothing Then
        Session.Prompt "Selecciona primero un paquete en el Browser.", 0
        Exit Sub
    End If

    ' ---- 1. Crear el diagrama de secuencia ----
    Dim dia As EA.Diagram
    Set dia = pkg.Diagrams.AddNew("CU01 - Iniciar Sesion", "Sequence")
    dia.Update
    pkg.Diagrams.Refresh

    ' ---- 2. Crear los participantes (lifelines) ----
    Dim nombres(6)
    nombres(0) = "Usuario"
    nombres(1) = "LoginForm"
    nombres(2) = "AuthController"
    nombres(3) = "AuthService"
    nombres(4) = "bcrypt"
    nombres(5) = "JwtService"
    nombres(6) = "PostgreSQL"

    Dim els(6)
    Dim i

    For i = 0 To 6
        Dim el As EA.Element
        If i = 0 Then
            ' El primero como Actor
            Set el = pkg.Elements.AddNew(nombres(i), "Actor")
        Else
            Set el = pkg.Elements.AddNew(nombres(i), "Sequence")
        End If
        el.Update
        Set els(i) = el
    Next
    pkg.Elements.Refresh

    ' ---- 3. Colocar los participantes en el diagrama ----
    For i = 0 To 6
        Dim dobj As EA.DiagramObject
        Set dobj = dia.DiagramObjects.AddNew("l=" & (40 + i * 150) & ";r=" & (120 + i * 150) & ";t=-20;b=-60", "")
        dobj.ElementID = els(i).ElementID
        dobj.Sequence = i + 1
        dobj.Update
    Next
    dia.DiagramObjects.Refresh

    ' ---- 4. Crear los mensajes (connectors tipo Sequence) ----
    AddMsg els(0), els(1), "ingresa correo y password", 1
    AddMsg els(1), els(2), "POST /auth/login (LoginDto)", 2
    AddMsg els(2), els(3), "login(dto)", 3
    AddMsg els(3), els(6), "findUnique(correo)", 4
    AddMsg els(6), els(3), "usuario | null", 5
    AddMsg els(3), els(4), "compare(password, hash)", 6
    AddMsg els(4), els(3), "validPassword", 7
    AddMsg els(3), els(5), "sign({sub, email, role})", 8
    AddMsg els(5), els(3), "accessToken", 9
    AddMsg els(3), els(2), "{ accessToken, user }", 10
    AddMsg els(2), els(1), "200 OK { accessToken, user }", 11
    AddMsg els(1), els(0), "redirige al panel principal", 12

    Repository.ReloadDiagram dia.DiagramID
    Repository.OpenDiagram dia.DiagramID

    Session.Prompt "Diagrama de secuencia creado correctamente!" & vbCrLf & _
                   "Agrega los fragmentos 'alt' a mano si los necesitas.", 0

End Sub

'--------------------------------------------------------------
' Crea un mensaje (connector Sequence) entre dos elementos
'--------------------------------------------------------------
Sub AddMsg(origen, destino, texto, orden)
    Dim con As EA.Connector
    Set con = origen.Connectors.AddNew(texto, "Sequence")
    con.SupplierID = destino.ElementID
    con.SequenceNo = orden
    con.Update
    origen.Connectors.Refresh
End Sub

Main
