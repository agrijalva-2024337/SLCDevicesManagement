-- Diagnóstico T7: sedes con más de una ubicación activa.
-- Ejecutar ANTES de crear índice / regla 1:1. Motor: SQL Server.
-- LIMITACIÓN: SQL Server no soporta índices únicos parciales (WHERE habilitado = 1).
-- La regla 1:1 se aplica en la capa de aplicación.

USE SLCDevicesManagement;
GO

SELECT
    s.id_sede,
    s.nombre AS sede,
    s.id_empresa,
    COUNT(u.id_ubicacion) AS ubicaciones_activas,
    STRING_AGG(u.nombre, ' | ') WITHIN GROUP (ORDER BY u.nombre) AS ubicaciones
FROM sede s
INNER JOIN ubicacion u ON u.id_sede = s.id_sede AND u.habilitado = 1
GROUP BY s.id_sede, s.nombre, s.id_empresa
HAVING COUNT(u.id_ubicacion) > 1
ORDER BY s.nombre;
GO
