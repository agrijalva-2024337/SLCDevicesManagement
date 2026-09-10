-- Diagnóstico T4: duplicados existentes (insensible a mayúsculas/acentos vía UPPER).
-- Ejecutar ANTES de crear constraints. Motor: SQL Server.
-- TODO: confirmar alcance de unicidad por tabla.

USE SLCDevicesManagement;
GO

PRINT '=== empresas: nombre duplicado (global) ===';
SELECT UPPER(LTRIM(RTRIM(nombre))) AS nombre_norm, COUNT(*) AS cantidad
FROM empresa
GROUP BY UPPER(LTRIM(RTRIM(nombre)))
HAVING COUNT(*) > 1;

PRINT '=== empresas: nit_codigo duplicado (global) ===';
SELECT UPPER(LTRIM(RTRIM(nit_codigo))) AS nit_norm, COUNT(*) AS cantidad
FROM empresa
GROUP BY UPPER(LTRIM(RTRIM(nit_codigo)))
HAVING COUNT(*) > 1;

PRINT '=== sedes: (id_empresa, nombre) duplicado ===';
SELECT id_empresa, UPPER(LTRIM(RTRIM(nombre))) AS nombre_norm, COUNT(*) AS cantidad
FROM sede
GROUP BY id_empresa, UPPER(LTRIM(RTRIM(nombre)))
HAVING COUNT(*) > 1;

PRINT '=== areas: (id_sede, nombre) duplicado — vía sede implica empresa ===';
SELECT a.id_sede, s.id_empresa, UPPER(LTRIM(RTRIM(a.nombre))) AS nombre_norm, COUNT(*) AS cantidad
FROM area a
INNER JOIN sede s ON s.id_sede = a.id_sede
GROUP BY a.id_sede, s.id_empresa, UPPER(LTRIM(RTRIM(a.nombre)))
HAVING COUNT(*) > 1;

PRINT '=== proveedores: (id_empresa, nombre) duplicado ===';
SELECT id_empresa, UPPER(LTRIM(RTRIM(nombre))) AS nombre_norm, COUNT(*) AS cantidad
FROM proveedor
GROUP BY id_empresa, UPPER(LTRIM(RTRIM(nombre)))
HAVING COUNT(*) > 1;

PRINT '=== ubicaciones: (id_sede, nombre) duplicado ===';
SELECT id_sede, UPPER(LTRIM(RTRIM(nombre))) AS nombre_norm, COUNT(*) AS cantidad
FROM ubicacion
GROUP BY id_sede, UPPER(LTRIM(RTRIM(nombre)))
HAVING COUNT(*) > 1;

PRINT '=== paises: (id_empresa, nombre) duplicado ===';
SELECT id_empresa, UPPER(LTRIM(RTRIM(nombre))) AS nombre_norm, COUNT(*) AS cantidad
FROM pais
GROUP BY id_empresa, UPPER(LTRIM(RTRIM(nombre)))
HAVING COUNT(*) > 1;

PRINT '=== usuarios: correo duplicado (global) ===';
SELECT UPPER(LTRIM(RTRIM(correo))) AS correo_norm, COUNT(*) AS cantidad
FROM usuario
GROUP BY UPPER(LTRIM(RTRIM(correo)))
HAVING COUNT(*) > 1;

PRINT '=== responsables: (id_area, nombre_completo) duplicado ===';
SELECT id_area, UPPER(LTRIM(RTRIM(nombre_completo))) AS nombre_norm, COUNT(*) AS cantidad
FROM responsable
GROUP BY id_area, UPPER(LTRIM(RTRIM(nombre_completo)))
HAVING COUNT(*) > 1;
GO
