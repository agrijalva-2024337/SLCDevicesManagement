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
    WHERE [MigrationId] = N'20260908182046_AddEspecificacionesYPerifericosActivo'
)
BEGIN
    ALTER TABLE [activo] ADD [especificaciones_hardware] varchar(300) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260908182046_AddEspecificacionesYPerifericosActivo'
)
BEGIN
    ALTER TABLE [activo] ADD [perifericos_adicionales] varchar(300) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260908182046_AddEspecificacionesYPerifericosActivo'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260908182046_AddEspecificacionesYPerifericosActivo', N'8.0.10');
END;
GO

COMMIT;
GO

