import type { ReactNode } from 'react';
import { FileText, ShieldCheck } from 'lucide-react';
import Dialog from '../ui/Dialog';
import { LEGAL_VERSION } from '../../lib/db';
import type { LegalDoc } from '../../lib/dialogs';

const CONTROLLER = {
  name: '[PREENCHER: nome completo ou razão social]',
  doc: '[PREENCHER: CPF ou CNPJ, opcional para pessoa física]',
  email: '[PREENCHER: e-mail para assuntos de privacidade]',
  dpo: '[PREENCHER: nome do encarregado(a) ou "o próprio controlador"]',
};

const versionDate = new Date(`${LEGAL_VERSION}T12:00:00`).toLocaleDateString('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const H = ({ children }: { children: ReactNode }) => <h3 className="font-bold text-[#112340] text-base mt-6 mb-2">{children}</h3>;
const P = ({ children }: { children: ReactNode }) => <p className="mb-3">{children}</p>;
const UL = ({ children }: { children: ReactNode }) => <ul className="list-disc pl-5 space-y-1.5 mb-3">{children}</ul>;

const Privacy = () => (
  <>
    <P>
      Esta política explica, em linguagem direta, quais dados pessoais a UNIdus trata, por quê e quais são os seus direitos,
      conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018, “LGPD”).
    </P>

    <H>1. Quem é o responsável</H>
    <P>
      O controlador dos dados é <strong>{CONTROLLER.name}</strong> ({CONTROLLER.doc}). Encarregado(a) pelo tratamento de
      dados: {CONTROLLER.dpo}. Contato para qualquer assunto de privacidade: <strong>{CONTROLLER.email}</strong>.
    </P>

    <H>2. Navegar sem conta</H>
    <P>
      Você pode buscar, filtrar, favoritar e ver mapas sem criar conta. Nesse caso <strong>não coletamos dados pessoais</strong>:
      a busca e os favoritos ficam só no seu navegador e somem ao recarregar a página. Não usamos cookies de rastreamento,
      analytics nem publicidade.
    </P>
    <P>
      Ainda assim, como em qualquer site, seu navegador se conecta a alguns serviços para carregar a página, e eles recebem
      seu endereço IP e dados técnicos do navegador:
    </P>
    <UL>
      <li>
        <strong>Netlify</strong> (hospedagem do site, EUA): registros técnicos de acesso.
      </li>
      <li>
        <strong>Google Fonts</strong> (Google, EUA): fornece as fontes de texto.
      </li>
      <li>
        <strong>Unsplash</strong> (EUA): fornece as fotos ilustrativas.
      </li>
      <li>
        <strong>OpenStreetMap Foundation</strong> (Reino Unido): fornece as imagens do mapa.
      </li>
    </UL>
    <P>
      No armazenamento local do navegador (localStorage) guardamos apenas: (a) uma cópia de pontos de interesse públicos do
      mapa, para carregar mais rápido, sem nenhum dado sobre você; e (b) se você entrar na conta, o token de sessão, que é
      estritamente necessário para manter o login.
    </P>

    <H>3. Dados de quem cria conta</H>
    <UL>
      <li>
        <strong>E-mail</strong>: para o login por link de acesso e avisos sobre a conta. Nunca é mostrado a outros usuários.
      </li>
      <li>
        <strong>Nome de exibição</strong>: aparece para as pessoas com quem você conversa.
      </li>
      <li>
        <strong>Declaração de maioridade e registro do aceite</strong> destes termos (versão e data).
      </li>
      <li>
        <strong>Anúncios</strong> que você publicar: tipo, título, bairro, campus próximo, valores, descrição e diferenciais;
        nas repúblicas, também a rotina da casa (silêncio, visitas, limpeza, contas e combinados). Essa parte descreve a
        casa, não as pessoas: não pedimos nem publicamos dados dos moradores.
      </li>
      <li>
        <strong>Endereço do imóvel anunciado</strong> (CEP, rua, número, complemento, cidade e UF):{' '}
        <strong>fica privado</strong>. Só você e a moderação têm acesso a ele, para conferir que o imóvel existe e marcar
        um ponto <em>aproximado</em> no mapa. No site aparecem apenas o bairro e esse ponto aproximado; o endereço completo
        só chega a um interessado se você mesmo o enviar pelo chat.
      </li>
      <li>
        <strong>Fotos e vídeo do imóvel</strong>: antes do envio, ainda no seu aparelho, removemos a localização GPS e os
        demais dados ocultos dos arquivos (nas fotos, todos os metadados; nos vídeos, os de localização). Ficam privados
        enquanto o anúncio está em análise e passam a ser exibidos só depois da aprovação.
      </li>
      <li>
        <strong>Mensagens</strong> trocadas com anunciantes ou interessados.
      </li>
      <li>
        <strong>Registros técnicos</strong> de autenticação (data, hora e IP do login), mantidos pelo provedor do banco de
        dados por segurança.
      </li>
    </UL>
    <P>Não coletamos CPF, telefone, documentos, dados bancários nem dados sensíveis.</P>

    <H>4. Para que usamos e com qual base legal</H>
    <UL>
      <li>
        Criar e manter sua conta, publicar anúncios e permitir conversas: <strong>execução de contrato</strong> (art. 7º, V),
        isto é, prestar o serviço que você pediu ao aceitar os Termos de Uso.
      </li>
      <li>
        Moderar anúncios e prevenir fraudes e golpes: <strong>legítimo interesse</strong> (art. 7º, IX), de proteger quem procura
        moradia.
      </li>
      <li>
        Guardar registros de acesso e atender ordens de autoridades: <strong>cumprimento de obrigação legal</strong> (art. 7º, II),
        como o Marco Civil da Internet.
      </li>
    </UL>
    <P>Não vendemos dados, não enviamos marketing e não usamos seus dados para publicidade.</P>

    <H>5. Com quem compartilhamos</H>
    <UL>
      <li>
        <strong>Supabase</strong>: banco de dados e login, com servidores em São Paulo (Brasil), atuando como operador.
      </li>
      <li>
        <strong>Netlify</strong>: hospedagem do site, nos EUA.
      </li>
      <li>
        <strong>ViaCEP</strong> (Brasil): ao anunciar, o CEP digitado é consultado para preencher rua, bairro e cidade. Só o
        CEP é enviado, sem nenhum outro dado seu.
      </li>
      <li>
        <strong>Outros usuários</strong>: veem seus anúncios publicados (sem o endereço completo) e, nas conversas, seu nome e
        suas mensagens.
      </li>
      <li>
        <strong>Autoridades</strong>: somente mediante obrigação legal ou ordem judicial.
      </li>
    </UL>
    <P>
      Quando há transferência internacional (Netlify, Google Fonts, Unsplash), ela ocorre com fornecedores que adotam
      cláusulas contratuais e medidas de segurança compatíveis com a LGPD (art. 33).
    </P>

    <H>6. Por quanto tempo guardamos</H>
    <UL>
      <li>Conta, anúncios e mensagens: enquanto a conta existir. Ao excluir a conta, tudo é apagado na hora.</li>
      <li>Anúncio excluído: apagado na hora, junto com endereço, fotos, vídeo e as conversas sobre ele.</li>
      <li>Registros técnicos de acesso: até 6 meses, salvo obrigação legal de guardar por mais tempo.</li>
    </UL>

    <H>7. Seus direitos (art. 18) e como exercê-los</H>
    <P>Você pode, a qualquer momento e sem custo:</P>
    <UL>
      <li>
        <strong>confirmar e acessar</strong> seus dados e <strong>levá-los com você</strong>: em <em>Minha conta → Meus dados →
        Baixar arquivo</em>;
      </li>
      <li>
        <strong>corrigir</strong> seu nome: em <em>Minha conta → Meus dados</em>;
      </li>
      <li>
        <strong>eliminar</strong> sua conta e todos os dados: em <em>Minha conta → Meus dados → Excluir minha conta</em>;
      </li>
      <li>
        pedir informações sobre compartilhamento, se opor a um tratamento ou fazer qualquer outro pedido pelo e-mail{' '}
        <strong>{CONTROLLER.email}</strong>. Respondemos em até 15 dias;
      </li>
      <li>
        reclamar à <strong>Autoridade Nacional de Proteção de Dados (ANPD)</strong>, em gov.br/anpd.
      </li>
    </UL>

    <H>8. Menores de idade</H>
    <P>
      Criar conta, anunciar e conversar com anunciantes é permitido apenas para maiores de 18 anos. Quem tem menos de 18 pode
      navegar livremente, sem conta e sem fornecer dados.
    </P>

    <H>9. Segurança</H>
    <P>
      O acesso é sem senha (link enviado ao seu e-mail), a conexão é sempre criptografada (HTTPS) e o banco aplica regras de
      acesso por linha: cada pessoa só lê seus próprios dados e suas conversas. Em caso de incidente de segurança relevante,
      avisaremos os afetados e a ANPD, conforme o art. 48.
    </P>

    <H>10. Mudanças nesta política</H>
    <P>
      Se mudarmos algo importante, avisaremos no site e, para quem tem conta, pediremos um novo aceite. Versão vigente: {versionDate}.
    </P>
  </>
);

const Terms = () => (
  <>
    <P>Ao usar a UNIdus, você concorda com estes termos. Leia também a Política de Privacidade.</P>

    <H>1. O que é a UNIdus</H>
    <P>
      Uma plataforma independente que ajuda estudantes a encontrar moradia perto de faculdades paulistas. Não somos imobiliária,
      não somos parte nos contratos de aluguel e <strong>não temos vínculo oficial com nenhuma universidade</strong> citada.
      Operada por {CONTROLLER.name}.
    </P>

    <H>2. Anúncios ilustrativos</H>
    <P>
      Os anúncios marcados como ilustrativos (fotos, valores e descrições de exemplo) servem apenas para demonstrar a
      plataforma e não correspondem a imóveis disponíveis. Os pontos de interesse do mapa vêm do OpenStreetMap, um mapa
      colaborativo que pode estar incompleto ou desatualizado.
    </P>

    <H>3. Conta</H>
    <UL>
      <li>É preciso ter 18 anos ou mais para criar conta.</li>
      <li>Você é responsável pelo acesso ao seu e-mail, que funciona como chave de entrada.</li>
      <li>Você pode excluir sua conta a qualquer momento em Minha conta → Meus dados.</li>
    </UL>

    <H>4. Regras para anunciantes</H>
    <UL>
      <li>Anuncie apenas imóveis dos quais você é responsável ou tem autorização para anunciar.</li>
      <li>Informações devem ser verdadeiras: endereço, valores, contas, composição e condições.</li>
      <li>Não publique dados pessoais de terceiros (nomes, fotos de rosto, documentos) nem contatos no texto do anúncio.</li>
      <li>
        Envie apenas fotos e vídeos do próprio imóvel, feitos por você ou com autorização de quem fez. Evite mostrar o número
        da fachada, placas de rua, documentos ou pessoas.
      </li>
      <li>É proibido conteúdo discriminatório, enganoso, ilegal ou que não seja oferta de moradia.</li>
      <li>
        Todo anúncio passa por moderação e pode ser recusado ou removido, sem aviso prévio, se violar estes termos ou
        houver suspeita de golpe.
      </li>
    </UL>

    <H>5. Conversas</H>
    <P>
      As mensagens servem para tratar de moradia. É proibido assédio, spam, golpes ou pedido de pagamento antecipado sem visita.
      Contas que violarem essas regras podem ser suspensas.
    </P>

    <H>6. Segurança na negociação</H>
    <P>
      A UNIdus não intermedeia pagamentos. Visite o imóvel (ou faça chamada de vídeo), confira o contrato e a identidade do
      anunciante e <strong>nunca pague sinal antes de ver o imóvel</strong>. A negociação e o contrato são de responsabilidade
      exclusiva das partes.
    </P>

    <H>7. Responsabilidade</H>
    <P>
      Fazemos o possível para manter a plataforma segura e no ar, mas não garantimos disponibilidade contínua nem a veracidade
      de anúncios de terceiros. Nada nestes termos afasta os direitos previstos no Código de Defesa do Consumidor.
    </P>

    <H>8. Contato e alterações</H>
    <P>
      Dúvidas e denúncias: <strong>{CONTROLLER.email}</strong>. Podemos atualizar estes termos; mudanças importantes serão
      avisadas no site. Versão vigente: {versionDate}. Aplica-se a legislação brasileira.
    </P>
  </>
);

const LegalDialog = ({ doc, onClose }: { doc: LegalDoc; onClose: () => void }) => (
  <Dialog
    title={doc === 'privacy' ? 'Política de Privacidade' : 'Termos de Uso'}
    subtitle={`Versão de ${versionDate}`}
    icon={doc === 'privacy' ? <ShieldCheck className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
    onClose={onClose}
    size="lg"
    layer="top"
  >
    <div className="text-sm text-slate-700 leading-relaxed">{doc === 'privacy' ? <Privacy /> : <Terms />}</div>
  </Dialog>
);

export default LegalDialog;
