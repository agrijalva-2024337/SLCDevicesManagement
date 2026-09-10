-- T7 fix: deja como máximo 1 ubicación ACTIVA por sede.
-- Conserva la de menor id_ubicacion; deshabilita el resto.
-- Motor: SQL Server.

USE SLCDevicesManagement;
GO

;WITH ranked AS (
    SELECT
        id_ubicacion,
        id_sede,
        ROW_NUMBER() OVER (PARTITION BY id_sede ORDER BY id_ubicacion) AS rn
    FROM ubicacion
    WHERE habilitado = 1
)
UPDATE u
SET habilitado = 0
FROM ubicacion u
INNER JOIN ranked r ON r.id_ubicacion = u.id_ubicacion
WHERE r.rn > 1;

-- Verificación
SELECT
    s.id_sede,
    s.nombre AS sede,
    COUNT(u.id_ubicacion) AS ubicaciones_activas
FROM sede s
LEFT JOIN ubicacion u ON u.id_sede = s.id_sede AND u.habilitado = 1
GROUP BY s.id_sede, s.nombre
HAVING COUNT(u.id_ubicacion) > 1;
GO
