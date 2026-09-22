IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE TABLE [categoria_activo] (
        [id_categoria] int NOT NULL IDENTITY,
        [nombre] varchar(100) NOT NULL,
        [descripcion] varchar(200) NULL,
        [habilitado] bit NOT NULL DEFAULT CAST(1 AS bit),
        CONSTRAINT [PK_categoria_activo] PRIMARY KEY ([id_categoria])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE TABLE [empresa] (
        [id_empresa] int NOT NULL IDENTITY,
        [nombre] varchar(150) NOT NULL,
        [nit_codigo] varchar(50) NOT NULL,
        [direccion] varchar(150) NULL,
        [telefono] varchar(30) NULL,
        [habilitado] bit NOT NULL DEFAULT CAST(1 AS bit),
        CONSTRAINT [PK_empresa] PRIMARY KEY ([id_empresa])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE TABLE [estado] (
        [id_estado] int NOT NULL IDENTITY,
        [nombre] varchar(50) NOT NULL,
        [descripcion] varchar(150) NULL,
        CONSTRAINT [PK_estado] PRIMARY KEY ([id_estado])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE TABLE [pais] (
        [id_pais] int NOT NULL IDENTITY,
        [nombre] varchar(100) NOT NULL,
        [codigo_iso2] varchar(2) NOT NULL,
        [codigo_iso3] varchar(3) NOT NULL,
        [codigo_telefonico] varchar(5) NULL,
        CONSTRAINT [PK_pais] PRIMARY KEY ([id_pais])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE TABLE [tipo_asignacion] (
        [id_tipo_asignacion] int NOT NULL IDENTITY,
        [nombre] varchar(50) NOT NULL,
        [descripcion] varchar(150) NULL,
        CONSTRAINT [PK_tipo_asignacion] PRIMARY KEY ([id_tipo_asignacion])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE TABLE [ubicacion] (
        [id_ubicacion] int NOT NULL IDENTITY,
        [nombre] varchar(100) NOT NULL,
        [descripcion] varchar(200) NULL,
        [latitud] decimal(9,6) NOT NULL,
        [longitud] decimal(9,6) NOT NULL,
        [habilitado] bit NOT NULL DEFAULT CAST(1 AS bit),
        CONSTRAINT [PK_ubicacion] PRIMARY KEY ([id_ubicacion])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE TABLE [proveedor] (
        [id_proveedor] int NOT NULL IDENTITY,
        [id_empresa] int NOT NULL,
        [nombre] varchar(150) NOT NULL,
        [nit] varchar(50) NOT NULL,
        [nombre_contacto] varchar(100) NULL,
        [telefono] varchar(30) NULL,
        [correo] varchar(150) NULL,
        [habilitado] bit NOT NULL DEFAULT CAST(1 AS bit),
        CONSTRAINT [PK_proveedor] PRIMARY KEY ([id_proveedor]),
        CONSTRAINT [FK_proveedor_empresa_id_empresa] FOREIGN KEY ([id_empresa]) REFERENCES [empresa] ([id_empresa]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE TABLE [usuario] (
        [id_usuario] int NOT NULL IDENTITY,
        [id_empresa] int NULL,
        [nombres] varchar(100) NOT NULL,
        [apellidos] varchar(100) NOT NULL,
        [correo] varchar(150) NOT NULL,
        [username] varchar(50) NOT NULL,
        [password_hash] varchar(255) NOT NULL,
        [rol] varchar(50) NOT NULL,
        [fecha_creacion] datetime2 NOT NULL DEFAULT (GETDATE()),
        [habilitado] bit NOT NULL DEFAULT CAST(1 AS bit),
        CONSTRAINT [PK_usuario] PRIMARY KEY ([id_usuario]),
        CONSTRAINT [FK_usuario_empresa_id_empresa] FOREIGN KEY ([id_empresa]) REFERENCES [empresa] ([id_empresa]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE TABLE [sede] (
        [id_sede] int NOT NULL IDENTITY,
        [id_empresa] int NOT NULL,
        [id_pais] int NOT NULL,
        [nombre] varchar(100) NOT NULL,
        [direccion] varchar(100) NULL,
        [ciudad] varchar(100) NULL,
        [habilitado] bit NOT NULL DEFAULT CAST(1 AS bit),
        CONSTRAINT [PK_sede] PRIMARY KEY ([id_sede]),
        CONSTRAINT [FK_sede_empresa_id_empresa] FOREIGN KEY ([id_empresa]) REFERENCES [empresa] ([id_empresa]) ON DELETE NO ACTION,
        CONSTRAINT [FK_sede_pais_id_pais] FOREIGN KEY ([id_pais]) REFERENCES [pais] ([id_pais]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE TABLE [activo] (
        [id_activo] int NOT NULL IDENTITY,
        [id_categoria_activo] int NOT NULL,
        [id_proveedor] int NOT NULL,
        [id_ubicacion] int NULL,
        [nombre] varchar(150) NOT NULL,
        [descripcion] varchar(300) NULL,
        [marca] varchar(100) NULL,
        [modelo] varchar(100) NULL,
        [numero_serie] varchar(100) NULL,
        [fecha_compra] date NOT NULL,
        [costo_adquisicion] decimal(12,2) NOT NULL,
        [moneda] varchar(10) NULL,
        [numero_factura] varchar(50) NULL,
        [fecha_vencimiento_garantia] date NOT NULL,
        [observaciones] varchar(500) NULL,
        CONSTRAINT [PK_activo] PRIMARY KEY ([id_activo]),
        CONSTRAINT [FK_activo_categoria_activo_id_categoria_activo] FOREIGN KEY ([id_categoria_activo]) REFERENCES [categoria_activo] ([id_categoria]) ON DELETE NO ACTION,
        CONSTRAINT [FK_activo_proveedor_id_proveedor] FOREIGN KEY ([id_proveedor]) REFERENCES [proveedor] ([id_proveedor]) ON DELETE NO ACTION,
        CONSTRAINT [FK_activo_ubicacion_id_ubicacion] FOREIGN KEY ([id_ubicacion]) REFERENCES [ubicacion] ([id_ubicacion]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE TABLE [bitacora] (
        [id_bitacora] int NOT NULL IDENTITY,
        [id_usuario] int NOT NULL,
        [fecha_hora] datetime2 NOT NULL,
        [tipo_operacion] varchar(30) NOT NULL,
        [entidad_afectada] varchar(100) NOT NULL,
        [descripcion] varchar(300) NULL,
        [informacion_anterior] nvarchar(max) NULL,
        [informacion_nueva] nvarchar(max) NULL,
        CONSTRAINT [PK_bitacora] PRIMARY KEY ([id_bitacora]),
        CONSTRAINT [FK_bitacora_usuario_id_usuario] FOREIGN KEY ([id_usuario]) REFERENCES [usuario] ([id_usuario]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE TABLE [area] (
        [id_area] int NOT NULL IDENTITY,
        [id_sede] int NOT NULL,
        [nombre] varchar(100) NOT NULL,
        [descripcion] varchar(200) NULL,
        [habilitado] bit NOT NULL DEFAULT CAST(1 AS bit),
        CONSTRAINT [PK_area] PRIMARY KEY ([id_area]),
        CONSTRAINT [FK_area_sede_id_sede] FOREIGN KEY ([id_sede]) REFERENCES [sede] ([id_sede]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE TABLE [historico_inventario] (
        [id_historico_inventario] int NOT NULL IDENTITY,
        [id_sede] int NOT NULL,
        [cerrado] bit NOT NULL DEFAULT CAST(0 AS bit),
        [responsable] varchar(150) NULL,
        [fecha_inicio] datetime NOT NULL,
        [fecha_cierre] datetime2 NULL,
        [observaciones] varchar(300) NULL,
        CONSTRAINT [PK_historico_inventario] PRIMARY KEY ([id_historico_inventario]),
        CONSTRAINT [FK_historico_inventario_sede_id_sede] FOREIGN KEY ([id_sede]) REFERENCES [sede] ([id_sede]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE TABLE [responsable] (
        [id_responsable] int NOT NULL IDENTITY,
        [id_area] int NOT NULL,
        [nombre_completo] varchar(150) NOT NULL,
        [cargo] varchar(100) NULL,
        [correo] varchar(150) NULL,
        [telefono] varchar(30) NULL,
        [habilitado] bit NOT NULL DEFAULT CAST(1 AS bit),
        CONSTRAINT [PK_responsable] PRIMARY KEY ([id_responsable]),
        CONSTRAINT [FK_responsable_area_id_area] FOREIGN KEY ([id_area]) REFERENCES [area] ([id_area]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE TABLE [detalle_activo] (
        [id_detalle_activo] int NOT NULL IDENTITY,
        [id_activo] int NOT NULL,
        [id_historico_inventario] int NOT NULL,
        [encontrado] bit NOT NULL,
        [buen_estado] bit NOT NULL,
        [observaciones] varchar(300) NULL,
        [fecha_verificacion] datetime NOT NULL,
        CONSTRAINT [PK_detalle_activo] PRIMARY KEY ([id_detalle_activo]),
        CONSTRAINT [FK_detalle_activo_activo_id_activo] FOREIGN KEY ([id_activo]) REFERENCES [activo] ([id_activo]) ON DELETE NO ACTION,
        CONSTRAINT [FK_detalle_activo_historico_inventario_id_historico_inventario] FOREIGN KEY ([id_historico_inventario]) REFERENCES [historico_inventario] ([id_historico_inventario]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE TABLE [asignacion] (
        [id_asignacion] int NOT NULL IDENTITY,
        [id_activo] int NOT NULL,
        [id_usuario] int NOT NULL,
        [id_responsable] int NOT NULL,
        [id_estado] int NOT NULL,
        [id_tipo_asignacion] int NOT NULL,
        [fecha_asignacion] datetime NOT NULL,
        [fecha_devolucion] datetime2 NULL,
        [activa] bit NOT NULL DEFAULT CAST(1 AS bit),
        [observaciones] varchar(300) NULL,
        [firma_entrega] varbinary(max) NULL,
        [fecha_firma_entrega] datetime2 NULL,
        [firma_recibe] varbinary(max) NULL,
        [documento_pdf_url] varchar(300) NULL,
        [documento_pdf_generado_en] datetime2 NULL,
        CONSTRAINT [PK_asignacion] PRIMARY KEY ([id_asignacion]),
        CONSTRAINT [FK_asignacion_activo_id_activo] FOREIGN KEY ([id_activo]) REFERENCES [activo] ([id_activo]) ON DELETE NO ACTION,
        CONSTRAINT [FK_asignacion_estado_id_estado] FOREIGN KEY ([id_estado]) REFERENCES [estado] ([id_estado]) ON DELETE NO ACTION,
        CONSTRAINT [FK_asignacion_responsable_id_responsable] FOREIGN KEY ([id_responsable]) REFERENCES [responsable] ([id_responsable]) ON DELETE NO ACTION,
        CONSTRAINT [FK_asignacion_tipo_asignacion_id_tipo_asignacion] FOREIGN KEY ([id_tipo_asignacion]) REFERENCES [tipo_asignacion] ([id_tipo_asignacion]) ON DELETE NO ACTION,
        CONSTRAINT [FK_asignacion_usuario_id_usuario] FOREIGN KEY ([id_usuario]) REFERENCES [usuario] ([id_usuario]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE TABLE [historial_activo] (
        [id_historial_activo] int NOT NULL IDENTITY,
        [id_asignacion] int NULL,
        [id_detalle_activo] int NULL,
        [fecha_hora] datetime NOT NULL,
        [tipo_operacion] varchar(30) NULL,
        [descripcion] varchar(300) NULL,
        [informacion_anterior] nvarchar(max) NULL,
        [informacion_nueva] nvarchar(max) NULL,
        CONSTRAINT [PK_historial_activo] PRIMARY KEY ([id_historial_activo]),
        CONSTRAINT [ck_historial_activo_una_sola_fuente] CHECK (([id_asignacion] IS NOT NULL AND [id_detalle_activo] IS NULL) OR ([id_asignacion] IS NULL AND [id_detalle_activo] IS NOT NULL)),
        CONSTRAINT [FK_historial_activo_asignacion_id_asignacion] FOREIGN KEY ([id_asignacion]) REFERENCES [asignacion] ([id_asignacion]) ON DELETE NO ACTION,
        CONSTRAINT [FK_historial_activo_detalle_activo_id_detalle_activo] FOREIGN KEY ([id_detalle_activo]) REFERENCES [detalle_activo] ([id_detalle_activo]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_activo_id_categoria_activo] ON [activo] ([id_categoria_activo]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_activo_id_proveedor] ON [activo] ([id_proveedor]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_activo_id_ubicacion] ON [activo] ([id_ubicacion]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_activo_numero_serie] ON [activo] ([numero_serie]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_area_id_sede] ON [area] ([id_sede]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [ix_asignacion_activo_unica_activa] ON [asignacion] ([id_activo]) WHERE [activa] = 1');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_asignacion_id_estado] ON [asignacion] ([id_estado]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_asignacion_id_responsable] ON [asignacion] ([id_responsable]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_asignacion_id_tipo_asignacion] ON [asignacion] ([id_tipo_asignacion]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_asignacion_id_usuario] ON [asignacion] ([id_usuario]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_bitacora_fecha_hora] ON [bitacora] ([fecha_hora]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_bitacora_id_usuario] ON [bitacora] ([id_usuario]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_categoria_activo_nombre] ON [categoria_activo] ([nombre]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_detalle_activo_id_activo] ON [detalle_activo] ([id_activo]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_detalle_activo_id_historico_inventario] ON [detalle_activo] ([id_historico_inventario]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_empresa_nit_codigo] ON [empresa] ([nit_codigo]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_estado_nombre] ON [estado] ([nombre]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_historial_activo_id_asignacion] ON [historial_activo] ([id_asignacion]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_historial_activo_id_detalle_activo] ON [historial_activo] ([id_detalle_activo]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_historico_inventario_id_sede] ON [historico_inventario] ([id_sede]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_pais_codigo_iso2] ON [pais] ([codigo_iso2]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_pais_codigo_iso3] ON [pais] ([codigo_iso3]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_proveedor_id_empresa] ON [proveedor] ([id_empresa]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_proveedor_nit] ON [proveedor] ([nit]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_responsable_id_area] ON [responsable] ([id_area]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_sede_id_empresa] ON [sede] ([id_empresa]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_sede_id_pais] ON [sede] ([id_pais]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_tipo_asignacion_nombre] ON [tipo_asignacion] ([nombre]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ubicacion_nombre] ON [ubicacion] ([nombre]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_usuario_correo] ON [usuario] ([correo]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_usuario_id_empresa] ON [usuario] ([id_empresa]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_usuario_username] ON [usuario] ([username]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260828210942_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260828210942_InitialCreate', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260831205422_AddIdSedeUbicacion'
)
BEGIN
    ALTER TABLE [ubicacion] ADD [id_sede] int NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260831205422_AddIdSedeUbicacion'
)
BEGIN
    CREATE INDEX [IX_ubicacion_id_sede] ON [ubicacion] ([id_sede]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260831205422_AddIdSedeUbicacion'
)
BEGIN
    ALTER TABLE [ubicacion] ADD CONSTRAINT [FK_ubicacion_sede_id_sede] FOREIGN KEY ([id_sede]) REFERENCES [sede] ([id_sede]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260831205422_AddIdSedeUbicacion'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260831205422_AddIdSedeUbicacion', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903163434_AddDetalleMantenimientoBajaTrasladoYEstadoActivo'
)
BEGIN
    ALTER TABLE [activo] ADD [id_estado] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903163434_AddDetalleMantenimientoBajaTrasladoYEstadoActivo'
)
BEGIN
    CREATE TABLE [detalle_traslado] (
        [id_detalle_traslado] int NOT NULL IDENTITY,
        [id_asignacion] int NOT NULL,
        [id_ubicacion_origen] int NOT NULL,
        [id_ubicacion_destino] int NOT NULL,
        [motivo] varchar(300) NULL,
        CONSTRAINT [PK_detalle_traslado] PRIMARY KEY ([id_detalle_traslado]),
        CONSTRAINT [FK_detalle_traslado_asignacion_id_asignacion] FOREIGN KEY ([id_asignacion]) REFERENCES [asignacion] ([id_asignacion]) ON DELETE NO ACTION,
        CONSTRAINT [FK_detalle_traslado_ubicacion_id_ubicacion_destino] FOREIGN KEY ([id_ubicacion_destino]) REFERENCES [ubicacion] ([id_ubicacion]) ON DELETE NO ACTION,
        CONSTRAINT [FK_detalle_traslado_ubicacion_id_ubicacion_origen] FOREIGN KEY ([id_ubicacion_origen]) REFERENCES [ubicacion] ([id_ubicacion]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903163434_AddDetalleMantenimientoBajaTrasladoYEstadoActivo'
)
BEGIN
    CREATE TABLE [motivo_baja] (
        [Id] int NOT NULL IDENTITY,
        [nombre] varchar(50) NOT NULL,
        [descripcion] varchar(150) NULL,
        CONSTRAINT [PK_motivo_baja] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903163434_AddDetalleMantenimientoBajaTrasladoYEstadoActivo'
)
BEGIN
    CREATE TABLE [tipo_mantenimiento] (
        [id_tipo_mantenimiento] int NOT NULL IDENTITY,
        [nombre] varchar(50) NOT NULL,
        [descripcion] varchar(150) NULL,
        CONSTRAINT [PK_tipo_mantenimiento] PRIMARY KEY ([id_tipo_mantenimiento])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903163434_AddDetalleMantenimientoBajaTrasladoYEstadoActivo'
)
BEGIN
    CREATE TABLE [detalle_baja] (
        [id_detalle_baja] int NOT NULL IDENTITY,
        [id_asignacion] int NOT NULL,
        [id_motivo_baja] int NOT NULL,
        [documento_referencia] varchar(300) NULL,
        [id_autorizado_por] int NOT NULL,
        CONSTRAINT [PK_detalle_baja] PRIMARY KEY ([id_detalle_baja]),
        CONSTRAINT [FK_detalle_baja_asignacion_id_asignacion] FOREIGN KEY ([id_asignacion]) REFERENCES [asignacion] ([id_asignacion]) ON DELETE NO ACTION,
        CONSTRAINT [FK_detalle_baja_motivo_baja_id_motivo_baja] FOREIGN KEY ([id_motivo_baja]) REFERENCES [motivo_baja] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_detalle_baja_usuario_id_autorizado_por] FOREIGN KEY ([id_autorizado_por]) REFERENCES [usuario] ([id_usuario]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903163434_AddDetalleMantenimientoBajaTrasladoYEstadoActivo'
)
BEGIN
    CREATE TABLE [detalle_mantenimiento] (
        [id_detalle_mantenimiento] int NOT NULL IDENTITY,
        [id_asignacion] int NOT NULL,
        [id_tipo_mantenimiento] int NOT NULL,
        [descripcion_problema] varchar(300) NOT NULL,
        [trabajo_realizado] varchar(300) NULL,
        [costo] decimal(12,2) NULL,
        [numero_factura] varchar(50) NULL,
        CONSTRAINT [PK_detalle_mantenimiento] PRIMARY KEY ([id_detalle_mantenimiento]),
        CONSTRAINT [FK_detalle_mantenimiento_asignacion_id_asignacion] FOREIGN KEY ([id_asignacion]) REFERENCES [asignacion] ([id_asignacion]) ON DELETE NO ACTION,
        CONSTRAINT [FK_detalle_mantenimiento_tipo_mantenimiento_id_tipo_mantenimiento] FOREIGN KEY ([id_tipo_mantenimiento]) REFERENCES [tipo_mantenimiento] ([id_tipo_mantenimiento]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903163434_AddDetalleMantenimientoBajaTrasladoYEstadoActivo'
)
BEGIN
    CREATE INDEX [IX_activo_id_estado] ON [activo] ([id_estado]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903163434_AddDetalleMantenimientoBajaTrasladoYEstadoActivo'
)
BEGIN
    CREATE UNIQUE INDEX [IX_detalle_baja_id_asignacion] ON [detalle_baja] ([id_asignacion]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903163434_AddDetalleMantenimientoBajaTrasladoYEstadoActivo'
)
BEGIN
    CREATE INDEX [IX_detalle_baja_id_autorizado_por] ON [detalle_baja] ([id_autorizado_por]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903163434_AddDetalleMantenimientoBajaTrasladoYEstadoActivo'
)
BEGIN
    CREATE INDEX [IX_detalle_baja_id_motivo_baja] ON [detalle_baja] ([id_motivo_baja]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903163434_AddDetalleMantenimientoBajaTrasladoYEstadoActivo'
)
BEGIN
    CREATE UNIQUE INDEX [IX_detalle_mantenimiento_id_asignacion] ON [detalle_mantenimiento] ([id_asignacion]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903163434_AddDetalleMantenimientoBajaTrasladoYEstadoActivo'
)
BEGIN
    CREATE INDEX [IX_detalle_mantenimiento_id_tipo_mantenimiento] ON [detalle_mantenimiento] ([id_tipo_mantenimiento]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903163434_AddDetalleMantenimientoBajaTrasladoYEstadoActivo'
)
BEGIN
    CREATE UNIQUE INDEX [IX_detalle_traslado_id_asignacion] ON [detalle_traslado] ([id_asignacion]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903163434_AddDetalleMantenimientoBajaTrasladoYEstadoActivo'
)
BEGIN
    CREATE INDEX [IX_detalle_traslado_id_ubicacion_destino] ON [detalle_traslado] ([id_ubicacion_destino]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903163434_AddDetalleMantenimientoBajaTrasladoYEstadoActivo'
)
BEGIN
    CREATE INDEX [IX_detalle_traslado_id_ubicacion_origen] ON [detalle_traslado] ([id_ubicacion_origen]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903163434_AddDetalleMantenimientoBajaTrasladoYEstadoActivo'
)
BEGIN
    CREATE UNIQUE INDEX [IX_motivo_baja_nombre] ON [motivo_baja] ([nombre]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903163434_AddDetalleMantenimientoBajaTrasladoYEstadoActivo'
)
BEGIN
    CREATE UNIQUE INDEX [IX_tipo_mantenimiento_nombre] ON [tipo_mantenimiento] ([nombre]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903163434_AddDetalleMantenimientoBajaTrasladoYEstadoActivo'
)
BEGIN
    ALTER TABLE [activo] ADD CONSTRAINT [FK_activo_estado_id_estado] FOREIGN KEY ([id_estado]) REFERENCES [estado] ([id_estado]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260903163434_AddDetalleMantenimientoBajaTrasladoYEstadoActivo'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260903163434_AddDetalleMantenimientoBajaTrasladoYEstadoActivo', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904194522_RenombrarIdMotivoBaja'
)
BEGIN
    EXEC sp_rename N'[motivo_baja].[Id]', N'id_motivo_baja', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904194522_RenombrarIdMotivoBaja'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260904194522_RenombrarIdMotivoBaja', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904221634_AddDispositivoTokenYRedConocida'
)
BEGIN
    CREATE TABLE [dispositivo_token] (
        [id_dispositivo_token] int NOT NULL IDENTITY,
        [id_activo] int NOT NULL,
        [token_hash] varchar(200) NOT NULL,
        [creado_en] datetime2 NOT NULL,
        [expira_en] datetime2 NULL,
        [ultimo_uso_en] datetime2 NULL,
        [revocado] bit NOT NULL DEFAULT CAST(0 AS bit),
        CONSTRAINT [PK_dispositivo_token] PRIMARY KEY ([id_dispositivo_token]),
        CONSTRAINT [FK_dispositivo_token_activo_id_activo] FOREIGN KEY ([id_activo]) REFERENCES [activo] ([id_activo]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904221634_AddDispositivoTokenYRedConocida'
)
BEGIN
    CREATE TABLE [red_conocida] (
        [id_red_conocida] int NOT NULL IDENTITY,
        [bssid] varchar(17) NOT NULL,
        [id_ubicacion] int NOT NULL,
        CONSTRAINT [PK_red_conocida] PRIMARY KEY ([id_red_conocida]),
        CONSTRAINT [FK_red_conocida_ubicacion_id_ubicacion] FOREIGN KEY ([id_ubicacion]) REFERENCES [ubicacion] ([id_ubicacion]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904221634_AddDispositivoTokenYRedConocida'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_dispositivo_token_id_activo] ON [dispositivo_token] ([id_activo]) WHERE [revocado] = 0');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904221634_AddDispositivoTokenYRedConocida'
)
BEGIN
    CREATE UNIQUE INDEX [IX_dispositivo_token_token_hash] ON [dispositivo_token] ([token_hash]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904221634_AddDispositivoTokenYRedConocida'
)
BEGIN
    CREATE UNIQUE INDEX [IX_red_conocida_bssid] ON [red_conocida] ([bssid]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904221634_AddDispositivoTokenYRedConocida'
)
BEGIN
    CREATE INDEX [IX_red_conocida_id_ubicacion] ON [red_conocida] ([id_ubicacion]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904221634_AddDispositivoTokenYRedConocida'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260904221634_AddDispositivoTokenYRedConocida', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907175936_AddGeolocalizacionDispositivo'
)
BEGIN
    ALTER TABLE [dispositivo_token] ADD [distancia_sede_metros] float NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907175936_AddGeolocalizacionDispositivo'
)
BEGIN
    ALTER TABLE [dispositivo_token] ADD [fuera_de_rango] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907175936_AddGeolocalizacionDispositivo'
)
BEGIN
    ALTER TABLE [dispositivo_token] ADD [ultima_direccion] varchar(300) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907175936_AddGeolocalizacionDispositivo'
)
BEGIN
    ALTER TABLE [dispositivo_token] ADD [ultima_latitud] decimal(9,6) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907175936_AddGeolocalizacionDispositivo'
)
BEGIN
    ALTER TABLE [dispositivo_token] ADD [ultima_longitud] decimal(9,6) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907175936_AddGeolocalizacionDispositivo'
)
BEGIN
    ALTER TABLE [dispositivo_token] ADD [ultima_precision_metros] float NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907175936_AddGeolocalizacionDispositivo'
)
BEGIN
    ALTER TABLE [dispositivo_token] ADD [ultima_ubicacion_detectada_id] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907175936_AddGeolocalizacionDispositivo'
)
BEGIN
    CREATE INDEX [IX_dispositivo_token_ultima_ubicacion_detectada_id] ON [dispositivo_token] ([ultima_ubicacion_detectada_id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907175936_AddGeolocalizacionDispositivo'
)
BEGIN
    ALTER TABLE [dispositivo_token] ADD CONSTRAINT [FK_dispositivo_token_ubicacion_ultima_ubicacion_detectada_id] FOREIGN KEY ([ultima_ubicacion_detectada_id]) REFERENCES [ubicacion] ([id_ubicacion]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907175936_AddGeolocalizacionDispositivo'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260907175936_AddGeolocalizacionDispositivo', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907211927_AddCoordenadasDispositivoToken'
)
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dispositivo_token]') AND [c].[name] = N'distancia_sede_metros');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [dispositivo_token] DROP CONSTRAINT [' + @var0 + '];');
    ALTER TABLE [dispositivo_token] DROP COLUMN [distancia_sede_metros];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907211927_AddCoordenadasDispositivoToken'
)
BEGIN
    DECLARE @var1 sysname;
    SELECT @var1 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dispositivo_token]') AND [c].[name] = N'ultima_direccion');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [dispositivo_token] DROP CONSTRAINT [' + @var1 + '];');
    ALTER TABLE [dispositivo_token] DROP COLUMN [ultima_direccion];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907211927_AddCoordenadasDispositivoToken'
)
BEGIN
    DECLARE @var2 sysname;
    SELECT @var2 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[dispositivo_token]') AND [c].[name] = N'ultima_precision_metros');
    IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [dispositivo_token] DROP CONSTRAINT [' + @var2 + '];');
    ALTER TABLE [dispositivo_token] DROP COLUMN [ultima_precision_metros];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907211927_AddCoordenadasDispositivoToken'
)
BEGIN
    ALTER TABLE [dispositivo_token] ADD [origen_coordenada] varchar(10) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907211927_AddCoordenadasDispositivoToken'
)
BEGIN
    ALTER TABLE [dispositivo_token] ADD [ultimo_bssid] varchar(17) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907211927_AddCoordenadasDispositivoToken'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260907211927_AddCoordenadasDispositivoToken', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907215943_AddTokenPublicoActivo'
)
BEGIN
    ALTER TABLE [activo] ADD [token_publico] varchar(32) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907215943_AddTokenPublicoActivo'
)
BEGIN
    UPDATE activo SET token_publico = LOWER(REPLACE(CONVERT(varchar(36), NEWID()), '-', '')) WHERE token_publico IS NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907215943_AddTokenPublicoActivo'
)
BEGIN
    DECLARE @var3 sysname;
    SELECT @var3 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[activo]') AND [c].[name] = N'token_publico');
    IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [activo] DROP CONSTRAINT [' + @var3 + '];');
    ALTER TABLE [activo] ALTER COLUMN [token_publico] varchar(32) NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907215943_AddTokenPublicoActivo'
)
BEGIN
    CREATE UNIQUE INDEX [IX_activo_token_publico] ON [activo] ([token_publico]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907215943_AddTokenPublicoActivo'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260907215943_AddTokenPublicoActivo', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907223923_AgregarHashDocumentoPdf'
)
BEGIN
    ALTER TABLE [asignacion] ADD [documento_pdf_hash] varchar(64) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260907223923_AgregarHashDocumentoPdf'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260907223923_AgregarHashDocumentoPdf', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260908180232_AddEspecificacionesYPerifericosActivo'
)
BEGIN
    ALTER TABLE [activo] ADD [especificaciones_hardware] varchar(500) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260908180232_AddEspecificacionesYPerifericosActivo'
)
BEGIN
    ALTER TABLE [activo] ADD [perifericos_adicionales] varchar(500) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260908180232_AddEspecificacionesYPerifericosActivo'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260908180232_AddEspecificacionesYPerifericosActivo', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260908193700_PaisPorEmpresa'
)
BEGIN
    DROP INDEX [IX_pais_codigo_iso2] ON [pais];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260908193700_PaisPorEmpresa'
)
BEGIN
    DROP INDEX [IX_pais_codigo_iso3] ON [pais];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260908193700_PaisPorEmpresa'
)
BEGIN
    ALTER TABLE [pais] ADD [id_empresa] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260908193700_PaisPorEmpresa'
)
BEGIN
    DECLARE @primeraEmpresa int = (SELECT TOP 1 id_empresa FROM empresa ORDER BY id_empresa);

    IF @primeraEmpresa IS NULL
    BEGIN
        IF EXISTS (SELECT 1 FROM pais)
            THROW 50001, 'No hay empresas para asignar a los paises existentes.', 1;
    END
    ELSE
    BEGIN
        UPDATE pais SET id_empresa = @primeraEmpresa WHERE id_empresa IS NULL;

        SELECT id_pais, nombre, codigo_iso2, codigo_iso3, codigo_telefonico
        INTO #paises_base
        FROM pais;

        INSERT INTO pais (nombre, codigo_iso2, codigo_iso3, codigo_telefonico, id_empresa)
        SELECT p.nombre, p.codigo_iso2, p.codigo_iso3, p.codigo_telefonico, e.id_empresa
        FROM #paises_base p
        INNER JOIN empresa e ON e.id_empresa <> @primeraEmpresa;

        UPDATE s
        SET s.id_pais = p_nuevo.id_pais
        FROM sede s
        INNER JOIN pais p_origen ON p_origen.id_pais = s.id_pais
        INNER JOIN pais p_nuevo ON p_nuevo.codigo_iso2 = p_origen.codigo_iso2
            AND p_nuevo.id_empresa = s.id_empresa
        WHERE p_origen.id_empresa <> s.id_empresa;

        DROP TABLE #paises_base;
    END
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260908193700_PaisPorEmpresa'
)
BEGIN
    DECLARE @var4 sysname;
    SELECT @var4 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[pais]') AND [c].[name] = N'id_empresa');
    IF @var4 IS NOT NULL EXEC(N'ALTER TABLE [pais] DROP CONSTRAINT [' + @var4 + '];');
    ALTER TABLE [pais] ALTER COLUMN [id_empresa] int NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260908193700_PaisPorEmpresa'
)
BEGIN
    CREATE UNIQUE INDEX [ix_pais_empresa_iso2] ON [pais] ([id_empresa], [codigo_iso2]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260908193700_PaisPorEmpresa'
)
BEGIN
    CREATE UNIQUE INDEX [ix_pais_empresa_iso3] ON [pais] ([id_empresa], [codigo_iso3]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260908193700_PaisPorEmpresa'
)
BEGIN
    ALTER TABLE [pais] ADD CONSTRAINT [FK_pais_empresa_id_empresa] FOREIGN KEY ([id_empresa]) REFERENCES [empresa] ([id_empresa]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260908193700_PaisPorEmpresa'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260908193700_PaisPorEmpresa', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260908213500_CategoriaPorEmpresa'
)
BEGIN
    DROP INDEX [IX_categoria_activo_nombre] ON [categoria_activo];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260908213500_CategoriaPorEmpresa'
)
BEGIN
    ALTER TABLE [categoria_activo] ADD [id_empresa] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260908213500_CategoriaPorEmpresa'
)
BEGIN
    DECLARE @primeraEmpresa int = (SELECT TOP 1 id_empresa FROM empresa ORDER BY id_empresa);

    IF @primeraEmpresa IS NULL
    BEGIN
        IF EXISTS (SELECT 1 FROM categoria_activo)
            THROW 50002, 'No hay empresas para asignar a las categorias existentes.', 1;
    END
    ELSE
    BEGIN
        UPDATE categoria_activo SET id_empresa = @primeraEmpresa WHERE id_empresa IS NULL;
    END
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260908213500_CategoriaPorEmpresa'
)
BEGIN
    DECLARE @var5 sysname;
    SELECT @var5 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[categoria_activo]') AND [c].[name] = N'id_empresa');
    IF @var5 IS NOT NULL EXEC(N'ALTER TABLE [categoria_activo] DROP CONSTRAINT [' + @var5 + '];');
    ALTER TABLE [categoria_activo] ALTER COLUMN [id_empresa] int NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260908213500_CategoriaPorEmpresa'
)
BEGIN
    CREATE UNIQUE INDEX [ix_categoria_activo_empresa_nombre] ON [categoria_activo] ([id_empresa], [nombre]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260908213500_CategoriaPorEmpresa'
)
BEGIN
    ALTER TABLE [categoria_activo] ADD CONSTRAINT [FK_categoria_activo_empresa_id_empresa] FOREIGN KEY ([id_empresa]) REFERENCES [empresa] ([id_empresa]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260908213500_CategoriaPorEmpresa'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260908213500_CategoriaPorEmpresa', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260910230148_AgregarIndiceUnicoActivoNumeroSerie'
)
BEGIN
    DROP INDEX [IX_activo_numero_serie] ON [activo];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260910230148_AgregarIndiceUnicoActivoNumeroSerie'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [ix_activo_numero_serie_unico] ON [activo] ([numero_serie]) WHERE [numero_serie] IS NOT NULL AND [numero_serie] <> ''''');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260910230148_AgregarIndiceUnicoActivoNumeroSerie'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260910230148_AgregarIndiceUnicoActivoNumeroSerie', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260910231202_AgregarIdEmpresaABitacora'
)
BEGIN
    ALTER TABLE [bitacora] ADD [id_empresa] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260910231202_AgregarIdEmpresaABitacora'
)
BEGIN
    CREATE INDEX [IX_bitacora_id_empresa] ON [bitacora] ([id_empresa]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260910231202_AgregarIdEmpresaABitacora'
)
BEGIN
    ALTER TABLE [bitacora] ADD CONSTRAINT [FK_bitacora_empresa_id_empresa] FOREIGN KEY ([id_empresa]) REFERENCES [empresa] ([id_empresa]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260910231202_AgregarIdEmpresaABitacora'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260910231202_AgregarIdEmpresaABitacora', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260910232304_CrearUsuarioEmpresaYMigrarDatos'
)
BEGIN
    CREATE TABLE [usuario_empresa] (
        [id_usuario_empresa] int NOT NULL IDENTITY,
        [id_usuario] int NOT NULL,
        [id_empresa] int NOT NULL,
        [rol] varchar(50) NOT NULL,
        CONSTRAINT [PK_usuario_empresa] PRIMARY KEY ([id_usuario_empresa]),
        CONSTRAINT [FK_usuario_empresa_empresa_id_empresa] FOREIGN KEY ([id_empresa]) REFERENCES [empresa] ([id_empresa]) ON DELETE NO ACTION,
        CONSTRAINT [FK_usuario_empresa_usuario_id_usuario] FOREIGN KEY ([id_usuario]) REFERENCES [usuario] ([id_usuario]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260910232304_CrearUsuarioEmpresaYMigrarDatos'
)
BEGIN
    CREATE INDEX [IX_usuario_empresa_id_empresa] ON [usuario_empresa] ([id_empresa]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260910232304_CrearUsuarioEmpresaYMigrarDatos'
)
BEGIN
    CREATE UNIQUE INDEX [IX_usuario_empresa_id_usuario_id_empresa] ON [usuario_empresa] ([id_usuario], [id_empresa]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260910232304_CrearUsuarioEmpresaYMigrarDatos'
)
BEGIN
    INSERT INTO usuario_empresa (id_usuario, id_empresa, rol)
    SELECT id_usuario, id_empresa, rol
    FROM usuario
    WHERE id_empresa IS NOT NULL
      AND NOT EXISTS (
          SELECT 1
          FROM usuario_empresa ue
          WHERE ue.id_usuario = usuario.id_usuario
            AND ue.id_empresa = usuario.id_empresa);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260910232304_CrearUsuarioEmpresaYMigrarDatos'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260910232304_CrearUsuarioEmpresaYMigrarDatos', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260910232854_AgregarCodigoInternoActivo'
)
BEGIN
    ALTER TABLE [activo] ADD [codigo_interno] varchar(50) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260910232854_AgregarCodigoInternoActivo'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [ix_activo_codigo_interno_unico] ON [activo] ([codigo_interno]) WHERE [codigo_interno] IS NOT NULL AND [codigo_interno] <> ''''');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260910232854_AgregarCodigoInternoActivo'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260910232854_AgregarCodigoInternoActivo', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911155943_EliminarIdEmpresaDeUsuario'
)
BEGIN
    ALTER TABLE [usuario] DROP CONSTRAINT [FK_usuario_empresa_id_empresa];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911155943_EliminarIdEmpresaDeUsuario'
)
BEGIN
    DROP INDEX [IX_usuario_id_empresa] ON [usuario];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911155943_EliminarIdEmpresaDeUsuario'
)
BEGIN
    DECLARE @var6 sysname;
    SELECT @var6 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[usuario]') AND [c].[name] = N'id_empresa');
    IF @var6 IS NOT NULL EXEC(N'ALTER TABLE [usuario] DROP CONSTRAINT [' + @var6 + '];');
    ALTER TABLE [usuario] DROP COLUMN [id_empresa];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911155943_EliminarIdEmpresaDeUsuario'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260911155943_EliminarIdEmpresaDeUsuario', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911171621_AgregarDpiAResponsable'
)
BEGIN
    ALTER TABLE [responsable] ADD [dpi] varchar(20) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911171621_AgregarDpiAResponsable'
)
BEGIN
    CREATE INDEX [IX_responsable_dpi] ON [responsable] ([dpi]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911171621_AgregarDpiAResponsable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260911171621_AgregarDpiAResponsable', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911184529_EstadoYTipoAsignacionPorEmpresa'
)
BEGIN
    DROP INDEX [IX_tipo_asignacion_nombre] ON [tipo_asignacion];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911184529_EstadoYTipoAsignacionPorEmpresa'
)
BEGIN
    DROP INDEX [IX_estado_nombre] ON [estado];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911184529_EstadoYTipoAsignacionPorEmpresa'
)
BEGIN
    ALTER TABLE [tipo_asignacion] ADD [id_empresa] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911184529_EstadoYTipoAsignacionPorEmpresa'
)
BEGIN
    ALTER TABLE [estado] ADD [id_empresa] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911184529_EstadoYTipoAsignacionPorEmpresa'
)
BEGIN
    DECLARE @primeraEmpresa int = (SELECT TOP 1 id_empresa FROM empresa ORDER BY id_empresa);

    IF @primeraEmpresa IS NULL
    BEGIN
        IF EXISTS (SELECT 1 FROM estado) OR EXISTS (SELECT 1 FROM tipo_asignacion)
            THROW 50003, 'No hay empresas para asignar a estados y tipos de asignacion existentes.', 1;
    END
    ELSE
    BEGIN
        UPDATE estado SET id_empresa = @primeraEmpresa WHERE id_empresa IS NULL;
        UPDATE tipo_asignacion SET id_empresa = @primeraEmpresa WHERE id_empresa IS NULL;

        SELECT id_estado, nombre, descripcion
        INTO #estados_base
        FROM estado;

        INSERT INTO estado (nombre, descripcion, id_empresa)
        SELECT b.nombre, b.descripcion, e.id_empresa
        FROM #estados_base b
        INNER JOIN empresa e ON e.id_empresa <> @primeraEmpresa;

        SELECT id_tipo_asignacion, nombre, descripcion
        INTO #tipos_base
        FROM tipo_asignacion;

        INSERT INTO tipo_asignacion (nombre, descripcion, id_empresa)
        SELECT b.nombre, b.descripcion, e.id_empresa
        FROM #tipos_base b
        INNER JOIN empresa e ON e.id_empresa <> @primeraEmpresa;

        UPDATE a
        SET a.id_estado = e_nuevo.id_estado
        FROM activo a
        INNER JOIN proveedor pr ON pr.id_proveedor = a.id_proveedor
        INNER JOIN estado e_origen ON e_origen.id_estado = a.id_estado
        INNER JOIN estado e_nuevo ON e_nuevo.nombre = e_origen.nombre
            AND e_nuevo.id_empresa = pr.id_empresa
        WHERE e_origen.id_empresa <> pr.id_empresa;

        UPDATE asig
        SET asig.id_estado = e_nuevo.id_estado
        FROM asignacion asig
        INNER JOIN activo a ON a.id_activo = asig.id_activo
        INNER JOIN proveedor pr ON pr.id_proveedor = a.id_proveedor
        INNER JOIN estado e_origen ON e_origen.id_estado = asig.id_estado
        INNER JOIN estado e_nuevo ON e_nuevo.nombre = e_origen.nombre
            AND e_nuevo.id_empresa = pr.id_empresa
        WHERE e_origen.id_empresa <> pr.id_empresa;

        UPDATE asig
        SET asig.id_tipo_asignacion = t_nuevo.id_tipo_asignacion
        FROM asignacion asig
        INNER JOIN activo a ON a.id_activo = asig.id_activo
        INNER JOIN proveedor pr ON pr.id_proveedor = a.id_proveedor
        INNER JOIN tipo_asignacion t_origen ON t_origen.id_tipo_asignacion = asig.id_tipo_asignacion
        INNER JOIN tipo_asignacion t_nuevo ON t_nuevo.nombre = t_origen.nombre
            AND t_nuevo.id_empresa = pr.id_empresa
        WHERE t_origen.id_empresa <> pr.id_empresa;

        DROP TABLE #estados_base;
        DROP TABLE #tipos_base;
    END
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911184529_EstadoYTipoAsignacionPorEmpresa'
)
BEGIN
    DECLARE @var7 sysname;
    SELECT @var7 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[tipo_asignacion]') AND [c].[name] = N'id_empresa');
    IF @var7 IS NOT NULL EXEC(N'ALTER TABLE [tipo_asignacion] DROP CONSTRAINT [' + @var7 + '];');
    ALTER TABLE [tipo_asignacion] ALTER COLUMN [id_empresa] int NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911184529_EstadoYTipoAsignacionPorEmpresa'
)
BEGIN
    DECLARE @var8 sysname;
    SELECT @var8 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[estado]') AND [c].[name] = N'id_empresa');
    IF @var8 IS NOT NULL EXEC(N'ALTER TABLE [estado] DROP CONSTRAINT [' + @var8 + '];');
    ALTER TABLE [estado] ALTER COLUMN [id_empresa] int NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911184529_EstadoYTipoAsignacionPorEmpresa'
)
BEGIN
    CREATE UNIQUE INDEX [ix_tipo_asignacion_empresa_nombre] ON [tipo_asignacion] ([id_empresa], [nombre]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911184529_EstadoYTipoAsignacionPorEmpresa'
)
BEGIN
    CREATE UNIQUE INDEX [ix_estado_empresa_nombre] ON [estado] ([id_empresa], [nombre]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911184529_EstadoYTipoAsignacionPorEmpresa'
)
BEGIN
    ALTER TABLE [estado] ADD CONSTRAINT [FK_estado_empresa_id_empresa] FOREIGN KEY ([id_empresa]) REFERENCES [empresa] ([id_empresa]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911184529_EstadoYTipoAsignacionPorEmpresa'
)
BEGIN
    ALTER TABLE [tipo_asignacion] ADD CONSTRAINT [FK_tipo_asignacion_empresa_id_empresa] FOREIGN KEY ([id_empresa]) REFERENCES [empresa] ([id_empresa]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911184529_EstadoYTipoAsignacionPorEmpresa'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260911184529_EstadoYTipoAsignacionPorEmpresa', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911191600_EliminarRolYUsuariosConsulta'
)
BEGIN
    IF EXISTS (
        SELECT 1
        FROM asignacion a
        INNER JOIN usuario u ON u.id_usuario = a.id_usuario
        WHERE u.rol = 'Consulta'
    )
    OR EXISTS (
        SELECT 1
        FROM detalle_baja d
        INNER JOIN usuario u ON u.id_usuario = d.id_autorizado_por
        WHERE u.rol = 'Consulta'
    )
        THROW 50004, 'No se pueden eliminar usuarios Consulta con asignaciones o bajas asociadas.', 1;

    DELETE b
    FROM bitacora b
    INNER JOIN usuario u ON u.id_usuario = b.id_usuario
    WHERE u.rol = 'Consulta';

    DELETE ue
    FROM usuario_empresa ue
    INNER JOIN usuario u ON u.id_usuario = ue.id_usuario
    WHERE u.rol = 'Consulta';

    DELETE FROM usuario WHERE rol = 'Consulta';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260911191600_EliminarRolYUsuariosConsulta'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260911191600_EliminarRolYUsuariosConsulta', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260914152632_UnicidadCatalogosAdministracion'
)
BEGIN
    DROP INDEX [IX_responsable_dpi] ON [responsable];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260914152632_UnicidadCatalogosAdministracion'
)
BEGIN
    DROP INDEX [IX_responsable_id_area] ON [responsable];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260914152632_UnicidadCatalogosAdministracion'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [ix_responsable_area_correo] ON [responsable] ([id_area], [correo]) WHERE [correo] IS NOT NULL AND [correo] <> ''''');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260914152632_UnicidadCatalogosAdministracion'
)
BEGIN
    CREATE UNIQUE INDEX [ix_responsable_area_nombre] ON [responsable] ([id_area], [nombre_completo]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260914152632_UnicidadCatalogosAdministracion'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [ix_responsable_dpi] ON [responsable] ([dpi]) WHERE [dpi] IS NOT NULL AND [dpi] <> ''''');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260914152632_UnicidadCatalogosAdministracion'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260914152632_UnicidadCatalogosAdministracion', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260914162035_UnicidadSedeAreaProveedorUbicacion'
)
BEGIN
    DROP INDEX [IX_ubicacion_nombre] ON [ubicacion];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260914162035_UnicidadSedeAreaProveedorUbicacion'
)
BEGIN
    DROP INDEX [IX_proveedor_nit] ON [proveedor];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260914162035_UnicidadSedeAreaProveedorUbicacion'
)
BEGIN
    CREATE UNIQUE INDEX [ix_ubicacion_sede_nombre] ON [ubicacion] ([id_sede], [nombre]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260914162035_UnicidadSedeAreaProveedorUbicacion'
)
BEGIN
    CREATE UNIQUE INDEX [ix_sede_empresa_nombre] ON [sede] ([id_empresa], [nombre]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260914162035_UnicidadSedeAreaProveedorUbicacion'
)
BEGIN
    CREATE UNIQUE INDEX [ix_proveedor_empresa_nit] ON [proveedor] ([id_empresa], [nit]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260914162035_UnicidadSedeAreaProveedorUbicacion'
)
BEGIN
    CREATE UNIQUE INDEX [ix_proveedor_empresa_nombre] ON [proveedor] ([id_empresa], [nombre]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260914162035_UnicidadSedeAreaProveedorUbicacion'
)
BEGIN
    CREATE UNIQUE INDEX [ix_area_sede_nombre] ON [area] ([id_sede], [nombre]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260914162035_UnicidadSedeAreaProveedorUbicacion'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260914162035_UnicidadSedeAreaProveedorUbicacion', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260916192200_UnicidadEmpresaNombre'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [ix_empresa_nombre_unico] ON [empresa] ([nombre]) WHERE [nombre] IS NOT NULL AND [nombre] <> ''''');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260916192200_UnicidadEmpresaNombre'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260916192200_UnicidadEmpresaNombre', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260916205157_ConsolidarPaisesGlobalYQuitarIdEmpresa'
)
BEGIN
    UPDATE s
    SET s.id_pais = canon.id_pais_canonico
    FROM sede s
    INNER JOIN pais p ON p.id_pais = s.id_pais
    INNER JOIN (
        SELECT codigo_iso2, MIN(id_pais) AS id_pais_canonico
        FROM pais
        GROUP BY codigo_iso2
    ) canon ON canon.codigo_iso2 = p.codigo_iso2
    WHERE s.id_pais <> canon.id_pais_canonico;

    DELETE p
    FROM pais p
    INNER JOIN (
        SELECT codigo_iso2, MIN(id_pais) AS id_pais_canonico
        FROM pais
        GROUP BY codigo_iso2
    ) canon ON canon.codigo_iso2 = p.codigo_iso2
    WHERE p.id_pais <> canon.id_pais_canonico;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260916205157_ConsolidarPaisesGlobalYQuitarIdEmpresa'
)
BEGIN
    ALTER TABLE [pais] DROP CONSTRAINT [FK_pais_empresa_id_empresa];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260916205157_ConsolidarPaisesGlobalYQuitarIdEmpresa'
)
BEGIN
    DROP INDEX [ix_pais_empresa_iso2] ON [pais];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260916205157_ConsolidarPaisesGlobalYQuitarIdEmpresa'
)
BEGIN
    DROP INDEX [ix_pais_empresa_iso3] ON [pais];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260916205157_ConsolidarPaisesGlobalYQuitarIdEmpresa'
)
BEGIN
    DECLARE @var9 sysname;
    SELECT @var9 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[pais]') AND [c].[name] = N'id_empresa');
    IF @var9 IS NOT NULL EXEC(N'ALTER TABLE [pais] DROP CONSTRAINT [' + @var9 + '];');
    ALTER TABLE [pais] DROP COLUMN [id_empresa];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260916205157_ConsolidarPaisesGlobalYQuitarIdEmpresa'
)
BEGIN
    CREATE UNIQUE INDEX [IX_pais_codigo_iso2] ON [pais] ([codigo_iso2]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260916205157_ConsolidarPaisesGlobalYQuitarIdEmpresa'
)
BEGIN
    CREATE UNIQUE INDEX [IX_pais_codigo_iso3] ON [pais] ([codigo_iso3]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260916205157_ConsolidarPaisesGlobalYQuitarIdEmpresa'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260916205157_ConsolidarPaisesGlobalYQuitarIdEmpresa', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260918120000_QuitarDocumentoReferenciaDetalleBaja'
)
BEGIN
    DECLARE @var10 sysname;
    SELECT @var10 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[detalle_baja]') AND [c].[name] = N'documento_referencia');
    IF @var10 IS NOT NULL EXEC(N'ALTER TABLE [detalle_baja] DROP CONSTRAINT [' + @var10 + '];');
    ALTER TABLE [detalle_baja] DROP COLUMN [documento_referencia];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260918120000_QuitarDocumentoReferenciaDetalleBaja'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260918120000_QuitarDocumentoReferenciaDetalleBaja', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260918190630_AgregarCodigoMonedaAPais'
)
BEGIN
    ALTER TABLE [pais] ADD [codigo_moneda] varchar(3) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260918190630_AgregarCodigoMonedaAPais'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260918190630_AgregarCodigoMonedaAPais', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260918194000_GuardarBytesActaAsignacion'
)
BEGIN
    CREATE TABLE [asignacion_documento_pdf] (
        [id_asignacion] int NOT NULL,
        [contenido] varbinary(max) NOT NULL,
        CONSTRAINT [PK_asignacion_documento_pdf] PRIMARY KEY ([id_asignacion]),
        CONSTRAINT [FK_asignacion_documento_pdf_asignacion_id_asignacion] FOREIGN KEY ([id_asignacion]) REFERENCES [asignacion] ([id_asignacion]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260918194000_GuardarBytesActaAsignacion'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260918194000_GuardarBytesActaAsignacion', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260918211326_AgregarHabilitadoAActivo'
)
BEGIN
    ALTER TABLE [activo] ADD [habilitado] bit NOT NULL DEFAULT CAST(1 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260918211326_AgregarHabilitadoAActivo'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260918211326_AgregarHabilitadoAActivo', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922184448_AddInstaladorAgenteToken'
)
BEGIN
    CREATE TABLE [instalador_agente_token] (
        [id_instalador_agente_token] int NOT NULL IDENTITY,
        [token] varchar(32) NOT NULL,
        [id_usuario_creador] int NOT NULL,
        [creado_en] datetime2 NOT NULL,
        [expira_en] datetime2 NOT NULL,
        [usado_en] datetime2 NULL,
        [revocado] bit NOT NULL DEFAULT CAST(0 AS bit),
        CONSTRAINT [PK_instalador_agente_token] PRIMARY KEY ([id_instalador_agente_token]),
        CONSTRAINT [FK_instalador_agente_token_usuario_id_usuario_creador] FOREIGN KEY ([id_usuario_creador]) REFERENCES [usuario] ([id_usuario]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922184448_AddInstaladorAgenteToken'
)
BEGIN
    CREATE INDEX [IX_instalador_agente_token_id_usuario_creador] ON [instalador_agente_token] ([id_usuario_creador]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922184448_AddInstaladorAgenteToken'
)
BEGIN
    CREATE UNIQUE INDEX [IX_instalador_agente_token_token] ON [instalador_agente_token] ([token]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260922184448_AddInstaladorAgenteToken'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260922184448_AddInstaladorAgenteToken', N'8.0.10');
END;
GO

COMMIT;
GO

