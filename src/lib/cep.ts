export interface CepResult {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export const onlyDigits = (v: string) => v.replace(/\D/g, '');

export const maskCep = (v: string) => {
  const d = onlyDigits(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

export const lookupCep = async (cep: string): Promise<CepResult | null> => {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`ViaCEP ${res.status}`);
    const json = (await res.json()) as {
      erro?: boolean | string;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    };
    if (json.erro) return null;
    return {
      street: json.logradouro ?? '',
      neighborhood: json.bairro ?? '',
      city: json.localidade ?? '',
      state: json.uf ?? '',
    };
  } finally {
    clearTimeout(timer);
  }
};
