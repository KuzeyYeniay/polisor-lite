
export type Lesson = {
  id: string;
  title: string;
  description: string;
  description_long: string;
  teacher: string;
  teacherImageId: string;
  imageId: string;
  calendar: { day: string; time: string; room: string }[];
};

export type New = {
  id: string;
  title: string;
  summary: string;
  link: string;
  imageId: string;
};

export const lessons: Lesson[] = [
  {
    id: 'computer-sciences',
    title: 'Computer Sciences',
    description: 'Algoritmalar, veri yapıları ve algoritmik düşünme ilkeleri dünyasını keşfedin.',
    description_long: '   Kuzey, Politecnico di Torino \'da Bilgisayar Mühendisliği öğrencisi ve bilgisayar bilimine son derece ilgilidir. Akranlarının başarılı olmasına yardımcı olma konusunda tutkuludur. Kendisi Computer Sciences dersinde sizlerle her hafta, okulun müfredatıyla bire bir uyumlu sınavlara sizleri kusursuz hazırlayacak olan kaynaklarını paylaşacak, cumartesi günleri ise bu kaynakların soru çözüm saatini düzenliyor olacak.',
    teacher: 'Kuzey',
    teacherImageId: 'teacher1',
    imageId: 'lesson1',
    calendar: [
      { day: 'Pazartesi', time: '12:00', room: 'Haftalık Kaynak Paylaşımı' },
      { day: 'Cumartesi', time: '10:00 - 12:30', room: 'Online Soru Çözüm Saati' },
    ],
  },
  {
    id: 'math-1',
    title: 'Mathematical Analysis-I',
    description: 'Limitler ve türevlerden, integrallere ve sonsuz serilere kadar kalkülüsün temellerine derinlemesine dalın.',
    description_long: '   Kaan, Politecnico di Torino\'da Bilgisayar Mühendisliği öğrencisi ve matematik konseptlerinde etkili öğretim yöntemleriyle tanınır. Karmaşık kavramları kolayca anlaşılır hale getirir. Kendisi Mathematical Analysis-I dersinde sizlerle her hafta, okulun müfredatıyla bire bir uyumlu sınavlara sizleri kusursuz hazırlayacak olan kaynaklarını paylaşacak, cumartesi günleri ise bu kaynakların soru çözüm saatini düzenliyor olacak.',
    teacher: 'Kaan',
    teacherImageId: 'teacher2',
    imageId: 'lesson2',
    calendar: [
      { day: 'Pazartesi', time: '12:00', room: 'Haftalık Kaynak Paylaşımı' },
      { day: 'Cumartesi', time: '10:00 - 12:30', room: 'Online Soru Çözüm Saati' },
    ],
  },
  {
    id: 'circuit-design',
    title: 'Chemistry',
    description: 'Maddenin yapı taşlarını ve dünyamızı şekillendiren kimyasal reaksiyonlara hakim olun.',
    description_long: '   Kuzey, Politecnico di Torino \'da Bilgisayar Mühendisliği öğrencisi ve kimya sınavlarında başarılı olmanın anahtarı olacak tüyolara sahiptir. Derin bir müfredatı olan Kimya dersi için sizleri derin bir soru havuzuyla karşılayacak. Kendisi Kimya dersinde sizlerle her hafta, okulun müfredatıyla bire bir uyumlu sınavlara sizleri kusursuz hazırlayacak olan kaynaklarını paylaşacak, cumartesi günleri ise bu kaynakların soru çözüm saatini düzenliyor olacak.',
    teacher: 'Kuzey',
    teacherImageId: 'teacher1',
    imageId: 'lesson3',
    calendar: [
      { day: 'Pazartesi', time: '12:00', room: 'Haftalık Kaynak Paylaşımı' },
      { day: 'Cumartesi', time: '10:00 - 12:30', room: 'Online Soru Çözüm Saati' },
    ],
  },
];

export const news: New[] = [
  {
    id: 'poliev',
    title: 'PoliEv - Torino Konaklama Danışmanınız',
    summary: 'PoliEv, öğrencilerin konaklama talepleri üzerinden birbirleriyle eşleşmelerini amaçlayan, kar amacı gütmeyen bir kuruluş',
    link: 'https://www.instagram.com/poli.ev.torino/',
    imageId: 'poliev',
  },
];

export const contactInfo = {
  phone: '+39 344 719 9398',
  email: 'poligrup44@gmail.com',
  address: 'Torino TO, Italy',
};

export type TeacherMaterial = {
  id: string;
  lesson: string;
  fileName: string;
  fileType: string;
  uploadDate: string;
  downloadURL?: string;
  storagePath?: string;
};

export const teacherMaterials: TeacherMaterial[] = [
    { id: '1', lesson: 'Computer Science 101', fileName: 'lecture_01.pdf', fileType: 'PDF', uploadDate: '2023-10-01' },
    { id: '2', lesson: 'Computer Science 101', fileName: 'assignment_1.docx', fileType: 'Word Document', uploadDate: '2023-10-03' },
    { id: '3', lesson: 'Mechanical Engineering', fileName: 'intro_slides.pptx', fileType: 'PowerPoint', uploadDate: '2023-10-02' },
    { id: '4', lesson: 'Circuit Design & Analysis', fileName: 'lab_manual.pdf', fileType: 'PDF', uploadDate: '2023-10-05' },
];

    