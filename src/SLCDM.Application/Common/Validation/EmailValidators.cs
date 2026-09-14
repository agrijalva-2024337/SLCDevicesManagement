using System.Text.RegularExpressions;
using FluentValidation;

namespace SLCDM.Application.Common.Validation;

/// <summary>
/// Misma expresión que <c>frontend/src/shared/validation/patterns.js</c> (<c>CORREO</c>).
/// </summary>
public static class EmailValidators
{
    // Copia exacta de CORREO en patterns.js (FE-19).
    private static readonly Regex PatronCorreo = new(
        @"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$",
        RegexOptions.CultureInvariant | RegexOptions.Compiled);

    public static bool EsCorreoValido(string? correo)
    {
        if (string.IsNullOrWhiteSpace(correo))
        {
            return false;
        }

        return PatronCorreo.IsMatch(correo.Trim());
    }

    public static IRuleBuilderOptions<T, TProperty> MustBeValidEmail<T, TProperty>(
        this IRuleBuilder<T, TProperty> ruleBuilder,
        string message = "El formato del correo no es valido.")
    {
        return ruleBuilder
            .Must(value =>
            {
                var correo = value as string;
                return string.IsNullOrWhiteSpace(correo) || EsCorreoValido(correo);
            })
            .WithMessage(message);
    }
}
