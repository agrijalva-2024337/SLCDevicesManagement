using CredentialManagement;

namespace SLCDM.Agent;

public static class CredencialAlmacen
{
    private const string Target = "SLCDM-DeviceToken";

    public static string? LeerToken()
    {
        using var cred = new Credential { Target = Target };
        return cred.Load() ? cred.Password : null;
    }

    public static void GuardarToken(string token)
    {
        using var cred = new Credential
        {
            Target = Target,
            Username = "device",
            Password = token,
            PersistanceType = PersistanceType.LocalComputer
        };
        cred.Save();
    }
}