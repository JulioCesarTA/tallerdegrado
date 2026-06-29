'==================================================================
' Script de Enterprise Architect (VBScript)
' Diagrama de Colaboracion / Comunicacion - CU01 Iniciar Sesion
' Patron Controller -> Service -> Repository
'
' CLAVE: en un diagrama de comunicacion los mensajes viajan SOBRE
' un enlace (link/association). Por eso el script:
'   1) crea los objetos
'   2) crea los ENLACES (Association) entre los que se comunican
'   3) crea los MENSAJES (Sequence) numerados encima de los enlaces
'      - IDA   = llamada a funcion (solida)
'      - VUELTA= retorno / valor (punteada)
'      - RECURSIVIDAD = un objeto se llama a si mismo
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

    ' ---------- 1. Crear el diagrama de Comunicacion ----------
    Set oDiagram = oPackage.Diagrams.AddNew("CU01 - Colaboracion Iniciar Sesion", "Communication")
    oDiagram.Update
    oPackage.Diagrams.Refresh

    ' ---------- 2. Crear los objetos (roles) ----------
    Dim oUsuario, oForm, oCtrl, oSvc, oRepo, oBcrypt, oJwt

    Set oUsuario = CrearElemento("Usuario",        "Actor",  "",          60,  60)
    Set oForm    = CrearElemento("LoginForm",      "Object", "boundary",  60,  300)
    Set oCtrl    = CrearElemento("AuthController", "Object", "control",   360, 60)
    Set oSvc     = CrearElemento("AuthService",    "Object", "control",   360, 300)
    Set oRepo    = CrearElemento("UserRepository", "Object", "entity",    680, 300)
    Set oBcrypt  = CrearElemento("BcryptHasher",   "Object", "utility",   680, 60)
    Set oJwt     = CrearElemento("JwtService",     "Object", "utility",   680, 520)

    oPackage.Elements.Refresh
    oDiagram.DiagramObjects.Refresh

    ' ---------- 3. Crear los ENLACES (links de comunicacion) ----------
    ' Un enlace por cada par de objetos que se comunican.
    CrearEnlace oUsuario, oForm
    CrearEnlace oForm,    oCtrl
    CrearEnlace oCtrl,    oSvc
    CrearEnlace oSvc,     oRepo
    CrearEnlace oSvc,     oBcrypt
    CrearEnlace oSvc,     oJwt

    ' ---------- 4. Crear los MENSAJES sobre los enlaces ----------
    ' CrearMensaje origen, destino, numero, texto, esRetorno

    ' IDA
    CrearMensaje oUsuario, oForm,    "1",   "ingresar(correo, password)", False
    ' RECURSIVIDAD (auto-llamada del formulario)
    CrearMensaje oForm,    oForm,    "1.1", "validarCampos()",            False
    CrearMensaje oForm,    oCtrl,    "2",   "login(credenciales)",        False
    CrearMensaje oCtrl,    oSvc,     "3",   "login(dto)",                 False
    CrearMensaje oSvc,     oRepo,    "4",   "findByCorreo(correo)",       False
    ' VUELTA
    CrearMensaje oRepo,    oSvc,     "5",   "usuario",                    True
    CrearMensaje oSvc,     oBcrypt,  "6",   "compare(password, hash)",    False
    CrearMensaje oBcrypt,  oSvc,     "7",   "validPassword",              True
    CrearMensaje oSvc,     oJwt,     "8",   "sign({sub, email, role})",   False
    CrearMensaje oJwt,     oSvc,     "9",   "accessToken",                True
    ' VUELTA en cadena
    CrearMensaje oSvc,     oCtrl,    "10",  "sesion",                     True
    CrearMensaje oCtrl,    oForm,    "11",  "200 OK { token, user }",     True
    CrearMensaje oForm,    oUsuario, "12",  "redirige al panel",          True

    Repository.ReloadDiagram oDiagram.DiagramID
    Repository.OpenDiagram oDiagram.DiagramID

    Session.Prompt "Diagrama de Colaboracion creado correctamente.", 0

End Sub

'------------------------------------------------------------------
' Crea un elemento y lo coloca en el diagrama
'------------------------------------------------------------------
Function CrearElemento(sNombre, sTipo, sEstereotipo, x, y)
    Dim el
    Set el = oPackage.Elements.AddNew(sNombre, sTipo)
    If sEstereotipo <> "" Then el.Stereotype = sEstereotipo
    el.Update

    Dim dobj
    Set dobj = oDiagram.DiagramObjects.AddNew("l=" & x & ";r=" & (x + 120) & ";t=" & y & ";b=" & (y + 80), "")
    dobj.ElementID = el.ElementID
    dobj.Update

    Set CrearElemento = el
End Function

'------------------------------------------------------------------
' Crea el ENLACE (Association) sobre el que viajaran los mensajes
'------------------------------------------------------------------
Sub CrearEnlace(oA, oB)
    ' No se crea enlace reflexivo (la auto-llamada no lo necesita)
    If oA.ElementID = oB.ElementID Then Exit Sub

    Dim con
    Set con = oA.Connectors.AddNew("", "Association")
    con.SupplierID = oB.ElementID
    con.Update
    oA.Connectors.Refresh
End Sub

'------------------------------------------------------------------
' Crea un MENSAJE de comunicacion (Sequence) numerado
'   bRetorno = True  -> retorno (linea punteada)
'   origen = destino -> mensaje reflexivo (recursividad)
'------------------------------------------------------------------
Sub CrearMensaje(oOrigen, oDestino, sNum, sTexto, bRetorno)
    Dim con
    Set con = oOrigen.Connectors.AddNew(sNum & ": " & sTexto, "Sequence")
    con.SupplierID = oDestino.ElementID
    con.SequenceNo = CInt(Split(sNum, ".")(0))

    ' Marca el tipo de mensaje (llamada vs retorno)
    Dim props
    If bRetorno Then
        con.Stereotype = "return"
        SetTag con, "kind", "return"
    Else
        SetTag con, "kind", "synchCall"
    End If

    con.Update
    oOrigen.Connectors.Refresh
End Sub

'------------------------------------------------------------------
' Asigna un tagged value al connector (helper)
'------------------------------------------------------------------
Sub SetTag(con, sNombre, sValor)
    Dim t
    Set t = con.TaggedValues.AddNew(sNombre, sValor)
    t.Update
    con.TaggedValues.Refresh
End Sub

Main
