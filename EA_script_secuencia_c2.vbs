'==================================================================
' Script de Enterprise Architect (VBScript)
' DIAGRAMA DE SECUENCIA - CU02 Gestionar Usuarios
' Participantes: UsuariosView -> UsersController -> UsersService
'                -> UsuarioRepository -> BD
' Funciones reales del backend (NestJS / Prisma)
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

    ' ---------- Crear el diagrama de Secuencia ----------
    Set oDiagram = oPackage.Diagrams.AddNew("CU02 - Secuencia Gestionar Usuarios", "Sequence")
    oDiagram.Update
    oPackage.Diagrams.Refresh

    ' ---------- Crear los participantes (lifelines) ----------
    Dim nombres(5)
    nombres(0) = "Administrador"
    nombres(1) = "UsuariosView"
    nombres(2) = "UsersController"
    nombres(3) = "UsersService"
    nombres(4) = "UsuarioRepository"
    nombres(5) = "BD"

    Dim els(5)
    Dim i
    For i = 0 To 5
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

    ' ---------- Colocar los participantes en el diagrama (compacto) ----------
    For i = 0 To 5
        Dim dobj
        Set dobj = oDiagram.DiagramObjects.AddNew("l=" & (30 + i * 150) & ";r=" & (110 + i * 150) & ";t=-15;b=-55", "")
        dobj.ElementID = els(i).ElementID
        dobj.Sequence = i + 1
        dobj.Update
    Next
    oDiagram.DiagramObjects.Refresh

    Dim n
    n = 0

    ' ===================== CREAR USUARIO =====================
    n = n + 1 : AddMsg els(0), els(1), n, "completar formulario"
    n = n + 1 : AddMsg els(1), els(2), n, "create(dto)"
    n = n + 1 : AddMsg els(2), els(3), n, "create(dto)"
    n = n + 1 : AddMsg els(3), els(4), n, "findUnique({ where: { correo } })"
    n = n + 1 : AddMsg els(4), els(5), n, "SELECT id FROM Usuario WHERE correo = ?"
    n = n + 1 : AddMsg els(5), els(4), n, "return(usuario | null)"
    n = n + 1 : AddMsg els(4), els(3), n, "return(usuario | null)"
    n = n + 1 : AddMsg els(3), els(3), n, "bcrypt.hash(password, 10)"
    n = n + 1 : AddMsg els(3), els(4), n, "create({ data })"
    n = n + 1 : AddMsg els(4), els(5), n, "INSERT INTO Usuario"
    n = n + 1 : AddMsg els(5), els(4), n, "return(usuario)"
    n = n + 1 : AddMsg els(4), els(3), n, "return(usuario)"
    n = n + 1 : AddMsg els(3), els(2), n, "return(usuario)"
    n = n + 1 : AddMsg els(2), els(1), n, "return(usuario creado)"
    n = n + 1 : AddMsg els(1), els(0), n, "muestra confirmacion"

    ' ===================== LISTAR USUARIOS =====================
    n = n + 1 : AddMsg els(0), els(1), n, "abrir lista"
    n = n + 1 : AddMsg els(1), els(2), n, "findAll()"
    n = n + 1 : AddMsg els(2), els(3), n, "findAll()"
    n = n + 1 : AddMsg els(3), els(4), n, "findMany({ select, orderBy })"
    n = n + 1 : AddMsg els(4), els(5), n, "SELECT * FROM Usuario ORDER BY nombre"
    n = n + 1 : AddMsg els(5), els(4), n, "return(usuarios[])"
    n = n + 1 : AddMsg els(4), els(3), n, "return(usuarios[])"
    n = n + 1 : AddMsg els(3), els(2), n, "return(usuarios[])"
    n = n + 1 : AddMsg els(2), els(1), n, "return(usuarios[])"
    n = n + 1 : AddMsg els(1), els(0), n, "muestra lista"

    ' ===================== ACTUALIZAR USUARIO =====================
    n = n + 1 : AddMsg els(0), els(1), n, "editar datos"
    n = n + 1 : AddMsg els(1), els(2), n, "update(id, dto)"
    n = n + 1 : AddMsg els(2), els(3), n, "update(id, dto)"
    n = n + 1 : AddMsg els(3), els(4), n, "findUnique({ where: { id } })"
    n = n + 1 : AddMsg els(4), els(5), n, "SELECT id FROM Usuario WHERE id = ?"
    n = n + 1 : AddMsg els(5), els(4), n, "return(usuario)"
    n = n + 1 : AddMsg els(4), els(3), n, "return(usuario)"
    n = n + 1 : AddMsg els(3), els(3), n, "bcrypt.hash(password, 10)"
    n = n + 1 : AddMsg els(3), els(4), n, "update({ where, data })"
    n = n + 1 : AddMsg els(4), els(5), n, "UPDATE Usuario SET ..."
    n = n + 1 : AddMsg els(5), els(4), n, "return(usuario)"
    n = n + 1 : AddMsg els(4), els(3), n, "return(usuario)"
    n = n + 1 : AddMsg els(3), els(2), n, "return(usuario)"
    n = n + 1 : AddMsg els(2), els(1), n, "return(usuario actualizado)"
    n = n + 1 : AddMsg els(1), els(0), n, "muestra confirmacion"

    ' ===================== ELIMINAR USUARIO =====================
    n = n + 1 : AddMsg els(0), els(1), n, "eliminar"
    n = n + 1 : AddMsg els(1), els(2), n, "remove(id)"
    n = n + 1 : AddMsg els(2), els(3), n, "remove(id)"
    n = n + 1 : AddMsg els(3), els(4), n, "findUnique({ where: { id } })"
    n = n + 1 : AddMsg els(4), els(5), n, "SELECT id FROM Usuario WHERE id = ?"
    n = n + 1 : AddMsg els(5), els(4), n, "return(usuario)"
    n = n + 1 : AddMsg els(4), els(3), n, "return(usuario)"
    n = n + 1 : AddMsg els(3), els(4), n, "delete({ where: { id } })"
    n = n + 1 : AddMsg els(4), els(5), n, "DELETE FROM Usuario WHERE id = ?"
    n = n + 1 : AddMsg els(5), els(4), n, "return(ok)"
    n = n + 1 : AddMsg els(4), els(3), n, "return(ok)"
    n = n + 1 : AddMsg els(3), els(2), n, "return({ message: 'Usuario eliminado' })"
    n = n + 1 : AddMsg els(2), els(1), n, "return(usuario eliminado)"
    n = n + 1 : AddMsg els(1), els(0), n, "muestra confirmacion"

    Repository.ReloadDiagram oDiagram.DiagramID
    Repository.OpenDiagram oDiagram.DiagramID

    Session.Prompt "Diagrama de Secuencia CU02 creado correctamente.", 0

End Sub

'------------------------------------------------------------------
' Crea un mensaje (connector Sequence) entre dos elementos
'------------------------------------------------------------------
Sub AddMsg(oOrigen, oDestino, nNum, sTexto)
    Dim con
    Set con = oOrigen.Connectors.AddNew(sTexto, "Sequence")
    con.SupplierID = oDestino.ElementID
    con.SequenceNo = nNum
    con.Update
    oOrigen.Connectors.Refresh
End Sub

Main
