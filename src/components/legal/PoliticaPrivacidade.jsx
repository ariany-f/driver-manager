import { useEffect } from 'react';
import LegalPage, { LegalSection } from './LegalPage.jsx';

const CONTACT = 'mell.angelis@unifesp.br';

export default function PoliticaPrivacidade() {
  useEffect(() => {
    document.title = 'Política de privacidade — Diário do Território';
    return () => {
      document.title = 'Driver Manager';
    };
  }, []);

  return (
    <LegalPage title="Política de privacidade">
      <p>
        O Diário do Território é um acervo digital feito para estudantes da Universidade Federal de São Paulo (UNIFESP). Esta página explica quais dados o site usa, em especial os dados da conta Google que a equipe conecta ao Google Drive.
      </p>

      <LegalSection title="Quem consulta e quem administra">
        <p>
          Estudantes e outras pessoas abrem o site e consultam os arquivos publicados sem criar conta e sem entrar com o Google.
        </p>
        <p>
          A equipe responsável entra com e-mail e senha do próprio site, separados da conta Google. Esse acesso serve para conectar o Drive, escolher a pasta do acervo, enviar arquivos e organizar formatos e tags.
        </p>
      </LegalSection>

      <LegalSection title="Conta Google e Google Drive">
        <p>
          Só a equipe autoriza uma conta Google. A senha dessa conta não passa pelo Diário do Território: a autorização acontece na tela do Google.
        </p>
        <p>
          O aplicativo solicita o escopo <span className="font-mono text-sm">https://www.googleapis.com/auth/drive</span>. Com essa permissão, o site:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>lê o e-mail da conta conectada para identificar qual conta está ligada;</li>
          <li>lista e lê os arquivos da pasta escolhida como acervo, para mostrá-los a quem abre o site;</li>
          <li>grava nessa pasta os arquivos que a equipe envia pelo site.</li>
        </ul>
        <p>
          O visitante não autoriza a própria conta Google. O restante do Drive dessa conta não entra na lista do acervo. Ao desconectar no site, nada é apagado no Google Drive.
        </p>
      </LegalSection>

      <LegalSection title="O que fica guardado">
        <p>No banco de dados da aplicação, no servidor, ficam:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>o token de atualização e o token de acesso da conta Google conectada;</li>
          <li>o identificador da pasta do acervo;</li>
          <li>identificador, nome, tipo e data de modificação dos arquivos exibidos;</li>
          <li>pastas internas, formatos, tags, mídias e a classificação de cada arquivo;</li>
          <li>logo, favicon e a opção de exibir o VLibras.</li>
        </ul>
        <p>
          O token fica só no servidor. Quem apenas consulta o acervo não recebe esse token.
        </p>
      </LegalSection>

      <LegalSection title="Uso dos dados do Google">
        <p>
          Os dados recebidos das APIs do Google são usados para manter o acervo: mostrar a pasta escolhida, abrir os arquivos e receber os envios da equipe. Não vendemos esses dados, não os usamos para anúncio e não os usamos para treinar modelos.
        </p>
        <p>
          O uso e a transferência, para qualquer outro aplicativo, das informações recebidas das APIs do Google seguem a <a className="underline font-bold" href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">Política de Dados do Usuário dos Serviços de API do Google</a>, inclusive os requisitos de Uso Limitado.
        </p>
      </LegalSection>

      <LegalSection title="Quem vê os arquivos">
        <p>
          Quem abre o site consegue ver e abrir os arquivos da pasta escolhida, mesmo sem login. A equipe deve publicar nessa pasta somente material que pode ser mostrado aos estudantes da UNIFESP.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Quem só consulta o acervo não recebe cookie de conta. Quando a equipe entra, o servidor grava um cookie HttpOnly chamado <span className="font-mono text-sm">acervo_session</span>. Durante a conexão com o Google, um cookie temporário guarda o estado do pedido por alguns minutos e depois é apagado.
        </p>
      </LegalSection>

      <LegalSection title="VLibras">
        <p>
          Se a equipe ativar, o site carrega o widget público do governo em vlibras.gov.br para tradução em Libras. Esse recurso é um serviço de terceiro.
        </p>
      </LegalSection>

      <LegalSection title="Por quanto tempo e como retirar o acesso">
        <p>
          Ao desconectar o Google Drive no site, o token, a lista de arquivos sincronizada e o identificador da pasta saem do banco. Os arquivos continuam na conta Google. Pastas, tags e formatos criados no site podem continuar no banco até a equipe apagá-los.
        </p>
        <p>
          A autorização também pode ser revogada na conta Google, em <a className="underline font-bold" href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">myaccount.google.com/permissions</a>.
        </p>
      </LegalSection>

      <LegalSection title="Contato">
        <p>
          Dúvidas sobre estes dados: <a className="underline font-bold" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
        <p>
          Os termos de uso estão em <a className="underline font-bold" href="/termos">/termos</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
