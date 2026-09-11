namespace SLCDM.Application.Features.Usuarios;

internal static class UsuarioEmpresaList
{
    public static IReadOnlyList<int> Normalize(IReadOnlyList<int>? ids)
    {
        if (ids is null || ids.Count == 0)
        {
            return [];
        }

        var seen = new HashSet<int>();
        var list = new List<int>(ids.Count);
        foreach (var id in ids)
        {
            if (id > 0 && seen.Add(id))
            {
                list.Add(id);
            }
        }

        return list;
    }
}
