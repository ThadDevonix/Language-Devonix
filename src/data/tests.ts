// แบบทดสอบ "ฟังแล้วพูดซ้ำ" (Elicited Imitation)
// ฟังประโยคหนึ่งครั้งโดยไม่เห็นตัวหนังสือ แล้วพูดซ้ำ ประโยคยาวขึ้นเรื่อย ๆ
// มี 2 ชุด (A/B) สลับกันทุกครั้ง เพื่อลดผลจากการจำข้อสอบ

export interface TestItem {
  id: string;
  en: string;
}

export interface TestForm {
  id: 'A' | 'B';
  items: TestItem[];
}

const make = (prefix: string, sentences: string[]): TestItem[] =>
  sentences.map((en, i) => ({ id: `${prefix}${i + 1}`, en }));

export const testForms: TestForm[] = [
  {
    id: 'A',
    items: make('ta', [
      'I like tea.',
      'She is my sister.',
      'The shop opens at nine.',
      'Can you help me, please?',
      'We go to school by bus.',
      'I usually eat rice for breakfast.',
      'My brother works in a big hotel.',
      'It is very hot in Bangkok today.',
      'Do you know where the nearest bank is?',
      'We watched a funny movie at home last night.',
      'I want to buy a small bag for my mother.',
      'The train to the city leaves at eight in the morning.',
      'If it rains tomorrow, we will stay at home and cook.',
      'My friend asked me to bring some water and fruit to the party.',
      'Before I go to bed, I always read a book for twenty minutes.',
    ]),
  },
  {
    id: 'B',
    items: make('tb', [
      'He is tired.',
      'This is my phone.',
      'The room is very clean.',
      'Where is the toilet, please?',
      'I drink coffee every morning.',
      'They live near the old market.',
      'Please close the window, it is cold.',
      'How much is one ticket for the bus?',
      'My mother cooks dinner for the family.',
      'I am going to visit my grandmother on Sunday.',
      'She did not come to work because she was sick.',
      'Could you tell me how to get to the train station?',
      'We need to buy eggs, milk, and bread from the supermarket.',
      'I would like to book a table for four people at seven tonight.',
      'When I was a child, I lived in a small house near the river.',
    ]),
  },
];

export const allTestItems = testForms.flatMap((f) => f.items);

/** ทำแบบทดสอบซ้ำได้ทุกกี่วัน */
export const TEST_INTERVAL_DAYS = 14;
