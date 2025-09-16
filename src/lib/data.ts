export type Lesson = {
  id: string;
  title: string;
  description: string;
  teacher: string;
  imageId: string;
  calendar: { day: string; time: string; room: string }[];
};

export type NewsArticle = {
  id: string;
  title: string;
  summary: string;
  link: string;
  imageId: string;
};

export const lessons: Lesson[] = [
  {
    id: 'computer-science-101',
    title: 'Computer Science 101',
    description: 'An introductory course to the fundamentals of computer science and programming.',
    teacher: 'Prof. Ada Lovelace',
    imageId: 'lesson1',
    calendar: [
      { day: 'Monday', time: '10:00 - 12:00', room: 'Room 1A' },
      { day: 'Wednesday', time: '14:00 - 16:00', room: 'Room 1A' },
    ],
  },
  {
    id: 'mechanical-engineering',
    title: 'Mechanical Engineering',
    description: 'Explore the principles of mechanics, materials, and energy.',
    teacher: 'Prof. James Watt',
    imageId: 'lesson2',
    calendar: [
      { day: 'Tuesday', time: '09:00 - 11:00', room: 'Lab 3B' },
      { day: 'Friday', time: '11:00 - 13:00', room: 'Lab 3B' },
    ],
  },
  {
    id: 'circuit-design',
    title: 'Circuit Design & Analysis',
    description: 'Learn to design and analyze analog and digital electronic circuits.',
    teacher: 'Prof. Nikola Tesla',
    imageId: 'lesson3',
    calendar: [
      { day: 'Monday', time: '16:00 - 18:00', room: 'Elec. Lab 1' },
      { day: 'Thursday', time: '09:00 - 11:00', room: 'Elec. Lab 1' },
    ],
  },
];

export const news: NewsArticle[] = [
  {
    id: 'new-research-grant',
    title: 'PoliTo Awarded Major Grant for Sustainable Energy Research',
    summary: 'The Department of Energy has awarded a significant grant to a team of researchers for their innovative work on next-generation solar panels.',
    link: '#',
    imageId: 'news1',
  },
  {
    id: 'robotics-competition-win',
    title: 'Student Team Wins International Robotics Competition',
    summary: 'Our student-led robotics team, "I BITE," has taken first place at the RoboWorld Championship in Geneva, showcasing their advanced autonomous vehicle.',
    link: '#',
    imageId: 'news2',
  },
];

export const contactInfo = {
  phone: '+39 011 090 1111',
  email: 'contact@polisor.lite',
  address: 'Corso Duca degli Abruzzi, 24, 10129 Torino TO, Italy',
};

export type TeacherMaterial = {
  id: string;
  lesson: string;
  fileName: string;
  fileType: string;
  uploadDate: string;
  downloadURL?: string;
};

export const teacherMaterials: TeacherMaterial[] = [
    { id: '1', lesson: 'Computer Science 101', fileName: 'lecture_01.pdf', fileType: 'PDF', uploadDate: '2023-10-01' },
    { id: '2', lesson: 'Computer Science 101', fileName: 'assignment_1.docx', fileType: 'Word Document', uploadDate: '2023-10-03' },
    { id: '3', lesson: 'Mechanical Engineering', fileName: 'intro_slides.pptx', fileType: 'PowerPoint', uploadDate: '2023-10-02' },
    { id: '4', lesson: 'Circuit Design & Analysis', fileName: 'lab_manual.pdf', fileType: 'PDF', uploadDate: '2023-10-05' },
];
