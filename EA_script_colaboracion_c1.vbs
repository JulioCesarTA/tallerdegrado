'==================================================================
' Script de Enterprise Architect (VBScript)
' DIAGRAMA DE COMUNICACION / ROBUSTEZ - CU01 Iniciar y Cerrar Sesion
'   Actor + Boundary + Control + Entity (las 3 "bolas")
'   Mensajes numerados 1.1, 1.2, 1.3 ... (incluye returns)
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
Dim gSeq

Sub Main

    Set oPackage = Repository.GetTreeSelectedPackage()
    If oPackage Is Nothing Then
        Session.Prompt "Selecciona primero un paquete en el Browser.", 0
        Exit Sub
    End If

    Set oDiagram = oPackage.Diagrams.AddNew("CU01 - Colaboracion Iniciar y Cerrar Sesion", "Communication")
    oDiagram.Update
    oPackage.Diagrams.Refresh

    ' ---------- Elementos (Actor + 3 pelotitas de robustez) ----------
    ' Boundary y Entity se crean como Class con estereotipo de robustez
    ' (los tipos "Boundary"/"Entity" de EA son otra cosa: cajas).
    Dim oUser, oVista, oCtrl, oSvc, oRepo
    Set oUser  = CrearElem("Usuario",                      "Actor", "",         40,  240)
    Set oVista = CrearElem("Vista (LoginView)",            "Class", "boundary", 240, 240)
    Set oCtrl  = CrearElem("Controlador (AuthController)", "Class", "control",  440, 100)
    Set oSvc   = CrearElem("Service (AuthService)",        "Class", "control",  640, 240)
    Set oRepo  = CrearElem("Repositorio (prisma.usuario)", "Class", "entity",   860, 240)

    oPackage.Elements.Refresh
    oDiagram.DiagramObjects.Refresh

    gSeq = 0

    ' ---------- Mensajes numerados ----------
    ' INICIAR SESION
    CrearMensaje oUser,  oVista, "1.1: ingresar(correo, password)"
    CrearMensaje oVista, oCtrl,  "1.2: login(dto)"
    CrearMensaje oCtrl,  oSvc,   "1.3: login(dto)"
    CrearMensaje oSvc,   oRepo,  "1.4: findUnique({ where: { correo } })"
    CrearMensaje oRepo,  oSvc,   "1.5: usuario"
    CrearMensaje oSvc,   oSvc,   "1.6: bcrypt.compare(password, hash)"
    CrearMensaje oSvc,   oSvc,   "1.7: validPassword"
    CrearMensaje oSvc,   oSvc,   "1.8: buildSession(usuario)"
    CrearMensaje oSvc,   oSvc,   "1.9: jwtService.sign({ sub, email, role })"
    CrearMensaje oSvc,   oSvc,   "1.10: accessToken"
    CrearMensaje oSvc,   oSvc,   "1.11: { accessToken, user }"
    CrearMensaje oSvc,   oCtrl,  "1.12: { accessToken, user }"
    CrearMensaje oCtrl,  oVista, "1.13: { accessToken, user }"
    CrearMensaje oVista, oUser,  "1.14: redirige al panel principal"

    ' CERRAR SESION
    CrearMensaje oUser,  oVista, "2.1: cerrarSesion()"
    CrearMensaje oVista, oVista, "2.2: eliminarToken()"
    CrearMensaje oVista, oVista, "2.3: ok"
    CrearMensaje oVista, oUser,  "2.4: redirige a Login"

    Repository.ReloadDiagram oDiagram.DiagramID
    Repository.OpenDiagram oDiagram.DiagramID

    Session.Prompt "Diagrama de Colaboracion CU01 creado (Actor + Boundary/Control/Entity).", 0

End Sub

'------------------------------------------------------------------
' Crea un elemento (Actor / Boundary / Control / Entity) y lo coloca
'------------------------------------------------------------------
Function CrearElem(sNombre, sTipo, sEstereotipo, x, y)
    Dim el
    Set el = oPackage.Elements.AddNew(sNombre, sTipo)
    If sEstereotipo <> "" Then el.Stereotype = sEstereotipo
    el.Update
    Dim dobj
    Set dobj = oDiagram.DiagramObjects.AddNew("l=" & x & ";r=" & (x + 100) & ";t=" & y & ";b=" & (y + 100), "")
    dobj.ElementID = el.ElementID
    dobj.Update
    Set CrearElem = el
End Function

'------------------------------------------------------------------
' Crea un mensaje tipo Sequence (igual que en el diagrama de secuencia,
' que SI mostro los nombres de funcion). El nombre lleva el numero.
'------------------------------------------------------------------
Sub CrearMensaje(oOrigen, oDestino, sTexto)
    Dim con
    Set con = oOrigen.Connectors.AddNew(sTexto, "Association")
    con.SupplierID = oDestino.ElementID
    con.Direction  = "Source -> Destination"
    con.Update
    oOrigen.Connectors.Refresh
End Sub

Main
