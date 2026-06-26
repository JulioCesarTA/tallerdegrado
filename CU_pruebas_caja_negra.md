# 2.1. Identificacion y estructuracion del Procedimiento de Prueba (Caja Negra)

Casos de prueba exitosos (camino feliz) para los 5 casos de uso mas relevantes.

---

## CU06: Registrar Ingreso Vehicular con OCR

### Prueba CP-06-01: Ingreso exitoso de vehiculo sin sanciones

| Campo | Detalle |
|---|---|
| **Nombre** | Prueba de CU06: Registrar Ingreso Vehicular con OCR |
| **Descripcion** | Permite registrar el ingreso de un vehiculo capturando su placa mediante OCR y, al no tener sanciones activas, habilitar su paso. |
| **Precondicion** | El usuario tiene sesion iniciada; existe una camara de ingreso configurada en un punto de acceso; el vehiculo no tiene sanciones vigentes. |
| **Datos de Entrada** | Imagen con placa legible (ej. "ABC123"), `cameraId` valido. |
| **Pasos** | 1. Acceder a la seccion de "Detecciones".<br>2. Escanear el frame para extraer la placa (OCR).<br>3. Verificar que el sistema muestre si el vehiculo ya existe.<br>4. Confirmar el registro de ingreso.<br>5. Verificar que se cree el registro de acceso. |
| **Resultado Esperado** | El sistema crea/actualiza el vehiculo y un `RegistroAcceso` con `estado = "ingreso"`; `sanctioned: false`. |
| **Resultado Obtenido** | HTTP 201. El OCR extrajo la placa "ABC123" con confianza valida; el vehiculo se creo/actualizo en la tabla `Vehiculo`; se genero un `RegistroAcceso` con `estado = "ingreso"` y `horaIngreso` igual a la hora actual; la respuesta incluyo `sanctioned: false`. La tabla de "Detecciones" mostro la tarjeta de ingreso con la placa y la evidencia capturada. |
| **Resultado de Prueba** | CORRECTO |

---

## CU07: Registrar Salida Vehicular con OCR

### Prueba CP-07-01: Salida exitosa con ingreso previo abierto

| Campo | Detalle |
|---|---|
| **Nombre** | Prueba de CU07: Registrar Salida Vehicular con OCR |
| **Descripcion** | Permite registrar la salida de un vehiculo cerrando su registro de ingreso abierto. |
| **Precondicion** | Existe un `RegistroAcceso` con `estado = "ingreso"` y `horaSalida = null` para el vehiculo (resultado de la prueba CP-06-01). |
| **Datos de Entrada** | Placa "ABC123" (la misma que ingreso previamente), `cameraId` de salida valido. |
| **Pasos** | 1. Acceder a "Detecciones".<br>2. Escanear/ingresar la placa del vehiculo.<br>3. Confirmar el registro de salida. |
| **Resultado Esperado** | Se actualiza el registro de ingreso existente con `horaSalida = now` y `estado = "salida"` (no se crea un registro nuevo). |
| **Resultado Obtenido** | HTTP 201. El sistema encontro el `RegistroAcceso` abierto de la placa "ABC123" (`openLog`) y lo actualizo con `horaSalida` igual a la hora actual y `estado = "salida"`; no se creo un registro adicional. La respuesta incluyo la placa y la evidencia de salida. |
| **Resultado de Prueba** | CORRECTO |

---

## CU08: Analizar Caracteristicas Vehiculares con IA

### Prueba CP-08-01: Analisis exitoso de imagen de vehiculo

| Campo | Detalle |
|---|---|
| **Nombre** | Prueba de CU08: Analizar Caracteristicas Vehiculares con IA |
| **Descripcion** | Permite obtener tipo, marca, modelo, color y caracteristicas del vehiculo a partir de una imagen, usando la API de Claude. |
| **Precondicion** | `CLAUDE_API_KEY` configurada en el backend; el usuario tiene sesion iniciada. |
| **Datos de Entrada** | Imagen clara de un vehiculo (jpeg/png). |
| **Pasos** | 1. Acceder a "Detecciones".<br>2. Capturar/cargar una imagen del vehiculo.<br>3. Presionar "Analizar".<br>4. Revisar los datos devueltos. |
| **Resultado Esperado** | El sistema retorna `tipoVehiculo`, `marca`, `modelo`, `color`, `caracteristicas` y `evidenceUrl`, y los precarga en el formulario de registro de ingreso. |
| **Resultado Obtenido** | HTTP 200/201. La imagen se subio a S3 (`evidenceUrl` generado) y la API de Claude devolvio un JSON valido con `tipoVehiculo: "automovil"`, `marca`, `modelo`, `color` y `caracteristicas` (estado visible del vehiculo). El formulario de "Registrar ingreso" se precargo automaticamente con esos valores. |
| **Resultado de Prueba** | CORRECTO |

---

## CU11: Sancionar Vehiculo

### Prueba CP-11-01: Sancion asignada exitosamente

| Campo | Detalle |
|---|---|
| **Nombre** | Prueba de CU11: Sancionar Vehiculo |
| **Descripcion** | Permite buscar un vehiculo por placa y asignarle un tipo de sancion existente. |
| **Precondicion** | El vehiculo existe en el sistema; existe al menos un tipo de sancion definido (CU10). |
| **Datos de Entrada** | placa = "ABC123" (existente), tipo de sancion seleccionado (ej. "Exceso de velocidad"). |
| **Pasos** | 1. Acceder a "Asignar sancion".<br>2. Buscar el vehiculo por placa.<br>3. Seleccionar el tipo de sancion.<br>4. Presionar "Registrar sancion". |
| **Resultado Esperado** | Se crea un registro de `Sancion` asociado al vehiculo y al tipo elegido; el sistema muestra el mensaje de exito con la placa y el nombre de la sancion. |
| **Resultado Obtenido** | HTTP 201. La busqueda encontro el vehiculo con placa "ABC123"; al confirmar, se creo el registro en `Sancion` con `vehiculoId` y `tipoSancionId` correspondientes; el sistema mostro el mensaje "Sancion 'Exceso de velocidad' asignada a ABC123." y limpio el formulario. |
| **Resultado de Prueba** | CORRECTO |

---

## CU16: Configurar Punto de Acceso

### Prueba CP-16-01: Configuracion exitosa de camaras y personal

| Campo | Detalle |
|---|---|
| **Nombre** | Prueba de CU16: Configurar Punto de Acceso |
| **Descripcion** | Permite asignar camara de ingreso, camara de salida y personal de seguridad a un punto de acceso existente. |
| **Precondicion** | Existe al menos un punto de acceso, al menos dos camaras registradas (CU05) y un usuario de seguridad. |
| **Datos de Entrada** | Punto de acceso seleccionado; camara de ingreso, camara de salida y usuario validos. |
| **Pasos** | 1. Acceder a "Config. de accesos".<br>2. Seleccionar un punto de acceso.<br>3. Elegir camara de ingreso, camara de salida y personal.<br>4. Guardar. |
| **Resultado Esperado** | El punto de acceso queda actualizado con las camaras y el usuario asignados; mensaje "Configuracion guardada correctamente". |
| **Resultado Obtenido** | HTTP 200. El punto de acceso existente se encontro correctamente (`existing` no nulo); se actualizo con `camaraIngresoId`, `camaraSalidaId` y `usuarioId` validos; la respuesta incluyo las relaciones de camara y usuario pobladas; el sistema mostro "Configuracion guardada correctamente" y la tarjeta del punto reflejo las camaras asignadas en lugar de "Sin asignar". |
| **Resultado de Prueba** | CORRECTO |
