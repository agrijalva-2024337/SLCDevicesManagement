
MERGE [estado] AS target
USING (VALUES
    (N'Disponible',      N'Activo sin asignacion activa, listo para entregarse'),
    (N'Asignado',        N'Activo entregado a un responsable, con asignacion activa'),
    (N'En mantenimiento', N'Activo en un mantenimiento preventivo o correctivo en curso'),
    (N'Dado de baja',    N'Activo dado de baja; no puede volver a asignarse, trasladarse ni entrar a mantenimiento')
) AS source ([nombre], [descripcion])
ON target.[nombre] = source.[nombre]
WHEN NOT MATCHED BY TARGET THEN
    INSERT ([nombre], [descripcion]) VALUES (source.[nombre], source.[descripcion]);
GO

MERGE [tipo_asignacion] AS target
USING (VALUES
    (N'Asignacion',   N'Entrega de un activo a un responsable'),
    (N'Traslado',     N'Movimiento de un activo entre ubicaciones de la misma empresa'),
   (N'Mantenimiento', N'Mantenimiento preventivo o correctivo de un activo'),
   (N'Baja',         N'Baja definitiva de un activo (venta, desecho, donacion, perdida, robo, dano irreparable, otro)')
) AS source ([nombre], [descripcion])
ON target.[nombre] = source.[nombre]
WHEN NOT MATCHED BY TARGET THEN
    INSERT ([nombre], [descripcion]) VALUES (source.[nombre], source.[descripcion]);
GO

MERGE [tipo_mantenimiento] AS target
USING (VALUES
    (N'Preventivo', N'Mantenimiento programado para prevenir fallas'),
    (N'Correctivo', N'Mantenimiento para reparar una falla ya ocurrida')
) AS source ([nombre], [descripcion])
ON target.[nombre] = source.[nombre]
WHEN NOT MATCHED BY TARGET THEN
    INSERT ([nombre], [descripcion]) VALUES (source.[nombre], source.[descripcion]);
GO

MERGE [motivo_baja] AS target
USING (VALUES
    (N'Venta',              N'El activo fue vendido'),
    (N'Desecho',            N'El activo fue desechado por fin de vida util'),
    (N'Donacion',           N'El activo fue donado'),
    (N'Perdida',            N'El activo se extravio'),
    (N'Robo',                N'El activo fue robado'),
    (N'Dano irreparable',   N'El activo sufrio un dano que no se puede reparar'),
    (N'Otro',                N'Otro motivo autorizado, no listado arriba')
) AS source ([nombre], [descripcion])
ON target.[nombre] = source.[nombre]
WHEN NOT MATCHED BY TARGET THEN
    INSERT ([nombre], [descripcion]) VALUES (source.[nombre], source.[descripcion]);
GO