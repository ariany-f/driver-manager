import { useEffect } from 'react';
import LegalPage, { LegalSection } from './LegalPage.jsx';

const CONTACT = 'mell.angelis@unifesp.br';

export default function TermosServico() {
  useEffect(() => {
    document.title = 'Termos de uso — Diário do Território';
    return () => {
      document.title = 'Diário do Território';
    };
  }, []);

  return (
    <LegalPage title="Termos de uso">
      <p>
        O Diário do Território é um acervo digital feito para estudantes da Universidade Federal de São Paulo (UNIFESP). Usar o site significa aceitar estes termos e a <a className="underline font-bold" href="/privacidade">política de privacidade</a>.
      </p>

      <LegalSection title="Consulta do acervo">
        <p>
          Estudantes podem consultar os arquivos publicados no acervo. Não é preciso criar conta nem entrar com o Google para ler o que está na pasta escolhida pela equipe.
        </p>
      </LegalSection>

      <LegalSection title="Equipe responsável">
        <p>
          Conectar o Google Drive, escolher a pasta, enviar arquivos, classificar e mudar as configurações cabe à equipe autorizada, com o login próprio do site. Essa senha não deve ser compartilhada.
        </p>
      </LegalSection>

      <LegalSection title="Google Drive">
        <p>
          A conexão usa a conta Google indicada pela equipe. O site não pede a senha do Google. A autorização permite ler a pasta do acervo e gravar nela os arquivos enviados pela equipe.
        </p>
        <p>
          Desconectar no site tira a autorização guardada na aplicação. Os arquivos continuam no Google Drive. A conta Google também pode revogar o acesso em <a className="underline font-bold" href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">myaccount.google.com/permissions</a>.
        </p>
      </LegalSection>

      <LegalSection title="Conteúdo publicado">
        <p>
          Os arquivos permanecem de quem os produziu e na conta Google em que estão. A equipe só deve publicar material que pode ser mostrado aos estudantes da UNIFESP.
        </p>
        <p>
          Não envie pelo site conteúdo ilegal, ofensivo, discriminatório ou que viole direito de outra pessoa. A equipe pode retirar do acervo o que não couber neste uso.
        </p>
      </LegalSection>

      <LegalSection title="Uso aceitável">
        <p>
          O site existe para consulta e organização desse acervo. Não use a aplicação para invadir, sobrecarregar ou desviar o serviço, nem para publicar material fora desse fim.
        </p>
      </LegalSection>

      <LegalSection title="Disponibilidade">
        <p>
          O Diário do Território é oferecido à comunidade da UNIFESP. Pode ficar indisponível para manutenção ou por falha de hospedagem, banco de dados ou Google Drive. Não há garantia de funcionamento sem interrupção.
        </p>
      </LegalSection>

      <LegalSection title="VLibras">
        <p>
          Quando a equipe deixa o VLibras ligado, a tradução para Libras é feita pelo widget do governo em vlibras.gov.br, um serviço de terceiro.
        </p>
      </LegalSection>

      <LegalSection title="Contato">
        <p>
          Dúvidas sobre estes termos: <a className="underline font-bold" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
        <p>
          Estes termos seguem as leis do Brasil.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
