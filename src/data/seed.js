export const initialTerritorios = [
  { id: 't1', name: 'Vila São Jorge', bgColor: '#1E3A5F', textColor: '#FDFBF7' },
  { id: 't2', name: 'Vila Nova', bgColor: '#C13B22', textColor: '#FDFBF7' },
  { id: 't3', name: 'Centro', bgColor: '#EAB308', textColor: '#2C1A14' },
  { id: 't4', name: 'Engenho', bgColor: '#849B55', textColor: '#FDFBF7' },
];

export const initialTags = [
  { id: 'tg1', name: 'Moradia Digna', bgColor: '#2C1A14', textColor: '#FDFBF7' },
  { id: 'tg2', name: 'Entrevista', bgColor: '#624A44', textColor: '#FDFBF7' },
  { id: 'tg3', name: 'Documento Histórico', bgColor: '#D34D34', textColor: '#2C1A14' },
  { id: 'tg4', name: 'Aprovado', bgColor: '#627933', textColor: '#FDFBF7' },
  { id: 'tg5', name: 'Revisão', bgColor: '#D9A100', textColor: '#2C1A14' },
];

export const initialFiles = [
  { id: 1, name: 'Documentário_Moradia.mp4', path: '/Projetos/Audiovisual', folderId: 'av', territorios: ['t1'], tags: ['tg1', 'tg4'], date: '2023-10-15', size: '245 MB', type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
  { id: 2, name: 'Anotacoes_Campo_VilaNova.pdf', path: '/Pesquisa/Cadernos', folderId: 'cad', territorios: ['t2'], tags: ['tg2', 'tg5'], date: '2023-10-16', size: '1.8 MB', type: 'document', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
  { id: 3, name: 'Foto_Ruinas_Engenho_01.jpg', path: '/Acervo Fotográfico', folderId: 'acervo', territorios: ['t4'], tags: ['tg3'], date: '2023-10-18', size: '5.1 MB', type: 'image', url: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1000&q=80' },
  { id: 4, name: 'Entrevista_Dona_Maria.wav', path: '/Projetos/Audiovisual/Áudio', folderId: 'audio', territorios: ['t3'], tags: ['tg1', 'tg2'], date: '2023-10-20', size: '32.2 MB', type: 'audio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 5, name: 'Manifesto_Associacao.pdf', path: '/Documentos Oficiais', folderId: 'docs', territorios: ['t3'], tags: ['tg1', 'tg3', 'tg4'], date: '2023-10-22', size: '145 KB', type: 'document', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
  { id: 6, name: 'Reunião_Conselho_Jan.mp4', path: '/Documentos Oficiais/Atas', folderId: 'atas', territorios: ['t1', 't3'], tags: ['tg3'], date: '2024-01-10', size: '120 MB', type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
  { id: 7, name: 'Mapa_Cartografico_1980.jpg', path: '/Pesquisa/Mapas', folderId: 'map', territorios: ['t1', 't2', 't4'], tags: ['tg3', 'tg4'], date: '2024-02-05', size: '12 MB', type: 'image', url: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1000&q=80' },
  { id: 8, name: 'Canto_Trabalho_Engenho.mp3', path: '/Acervo Fotográfico/Audio_Resgate', folderId: 'aresg', territorios: ['t4'], tags: ['tg3'], date: '2024-03-12', size: '4.5 MB', type: 'audio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 9, name: 'Relatório_Impacto_Ambiental.pdf', path: '/Projetos', folderId: 'proj', territorios: ['t1', 't4'], tags: ['tg1', 'tg5'], date: '2024-04-20', size: '3.4 MB', type: 'document', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
  { id: 10, name: 'Festa_Padroeira_VilaNova.jpg', path: '/Acervo Fotográfico', folderId: 'acervo', territorios: ['t2'], tags: ['tg3'], date: '2024-05-15', size: '8.1 MB', type: 'image', url: 'https://images.unsplash.com/photo-1533174000253-1d59d20c5d58?auto=format&fit=crop&w=1000&q=80' },
];

export const initialFolders = [
  { id: 'pesq', name: 'Pesquisa', children: [{ id: 'cad', name: 'Cadernos', children: [] }, { id: 'ref', name: 'Referências', children: [] }, { id: 'map', name: 'Mapas', children: [] }] },
  { id: 'proj', name: 'Projetos', children: [{ id: 'av', name: 'Audiovisual', children: [{ id: 'audio', name: 'Áudio', children: [] }] }] },
  { id: 'acervo', name: 'Acervo Fotográfico', children: [{ id: 'aresg', name: 'Audio_Resgate', children: [] }] },
  { id: 'docs', name: 'Documentos Oficiais', children: [{ id: 'atas', name: 'Atas', children: [] }] },
];
