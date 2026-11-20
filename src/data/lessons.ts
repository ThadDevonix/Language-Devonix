export interface Phrase {
  id: string;
  en: string;
  th: string;
  /** เคล็ดลับการออกเสียงสำหรับคนไทย */
  tip?: string;
}

export interface Lesson {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  phrases: Phrase[];
}

export const lessons: Lesson[] = [
  {
    id: 'greetings',
    emoji: '👋',
    title: 'ทักทาย',
    subtitle: 'Greetings',
    phrases: [
      { id: 'g1', en: 'Hello, how are you?', th: 'สวัสดี สบายดีไหม' },
      { id: 'g2', en: "I'm fine, thank you.", th: 'สบายดี ขอบคุณ', tip: '"thank" ให้วางปลายลิ้นแตะฟันบนเบา ๆ แล้วเป่าลม ไม่ใช่ "แต๊งค์"' },
      { id: 'g3', en: 'Nice to meet you.', th: 'ยินดีที่ได้รู้จัก', tip: '"nice" ลงท้ายด้วยเสียง /s/ ให้ได้ยินชัด ๆ' },
      { id: 'g4', en: 'Good morning.', th: 'สวัสดีตอนเช้า' },
      { id: 'g5', en: 'See you later.', th: 'แล้วเจอกันนะ' },
      { id: 'g6', en: 'Have a nice day.', th: 'ขอให้เป็นวันที่ดี', tip: '"have" ใช้เสียง /v/ ฟันบนแตะริมฝีปากล่าง ไม่ใช่ "แฮฟ" แบบเสียง ฟ' },
    ],
  },
  {
    id: 'intro',
    emoji: '🙋',
    title: 'แนะนำตัว',
    subtitle: 'Introducing yourself',
    phrases: [
      { id: 'i1', en: 'My name is Ann.', th: 'ฉันชื่อแอน' },
      { id: 'i2', en: 'I am from Thailand.', th: 'ฉันมาจากประเทศไทย', tip: '"Thailand" ออกเสียง "ไท-แลนด์" ตัว th ในคำนี้ออกเสียงเป็น ท ธรรมดา' },
      { id: 'i3', en: 'I live in Bangkok.', th: 'ฉันอาศัยอยู่ที่กรุงเทพฯ', tip: '"live" ลงท้ายด้วยเสียง /v/ เบา ๆ' },
      { id: 'i4', en: 'I work as a nurse.', th: 'ฉันทำงานเป็นพยาบาล' },
      { id: 'i5', en: 'I like listening to music.', th: 'ฉันชอบฟังเพลง', tip: '"like" ลงท้ายด้วย /k/ อย่ากลืนเสียงท้าย' },
      { id: 'i6', en: 'I am learning English.', th: 'ฉันกำลังเรียนภาษาอังกฤษ' },
    ],
  },
  {
    id: 'restaurant',
    emoji: '🍜',
    title: 'ร้านอาหาร',
    subtitle: 'At a restaurant',
    phrases: [
      { id: 'r1', en: 'A table for two, please.', th: 'ขอโต๊ะสำหรับสองคนครับ/ค่ะ' },
      { id: 'r2', en: 'Can I see the menu?', th: 'ขอดูเมนูได้ไหม' },
      { id: 'r3', en: "I'd like a glass of water.", th: 'ขอน้ำเปล่าหนึ่งแก้ว', tip: '"glass" มีเสียงควบกล้ำ gl ให้ออกเสียง ก กับ ล ติดกัน' },
      { id: 'r4', en: 'Not too spicy, please.', th: 'ไม่เผ็ดมากนะ', tip: '"spicy" ขึ้นต้นด้วย sp อย่าเติมเสียง "สะ" ข้างหน้า' },
      { id: 'r5', en: 'This is delicious.', th: 'อันนี้อร่อยมาก' },
      { id: 'r6', en: 'Can I have the bill, please?', th: 'ขอเช็คบิลด้วย' },
    ],
  },
  {
    id: 'shopping',
    emoji: '🛍️',
    title: 'ช้อปปิ้ง',
    subtitle: 'Shopping',
    phrases: [
      { id: 's1', en: 'How much is this?', th: 'อันนี้ราคาเท่าไหร่' },
      { id: 's2', en: 'Do you have a smaller size?', th: 'มีไซส์เล็กกว่านี้ไหม', tip: '"size" ลงท้ายเสียง /z/ ก้องในลำคอ' },
      { id: 's3', en: 'Can I try it on?', th: 'ขอลองใส่ได้ไหม' },
      { id: 's4', en: 'Can you give me a discount?', th: 'ลดราคาให้หน่อยได้ไหม' },
      { id: 's5', en: "I'll take it.", th: 'เอาอันนี้' },
      { id: 's6', en: 'Can I pay by card?', th: 'จ่ายด้วยบัตรได้ไหม' },
    ],
  },
  {
    id: 'directions',
    emoji: '🗺️',
    title: 'ถามทาง',
    subtitle: 'Asking for directions',
    phrases: [
      { id: 'd1', en: 'Excuse me, where is the station?', th: 'ขอโทษครับ/ค่ะ สถานีอยู่ที่ไหน' },
      { id: 'd2', en: 'Is it far from here?', th: 'ไกลจากที่นี่ไหม', tip: '"far" และ "from" ใช้เสียง /f/ ฟันบนแตะริมฝีปากล่าง' },
      { id: 'd3', en: 'Go straight and turn left.', th: 'ตรงไปแล้วเลี้ยวซ้าย', tip: '"straight" มีพยัญชนะ str ติดกันสามตัว ค่อย ๆ ฝึกช้า ๆ' },
      { id: 'd4', en: 'It is on your right.', th: 'อยู่ทางขวามือของคุณ', tip: '"right" ใช้เสียง /r/ ห่อปาก ไม่ใช่ "ไลท์"' },
      { id: 'd5', en: 'Can you show me on the map?', th: 'ช่วยชี้ในแผนที่ให้หน่อยได้ไหม' },
      { id: 'd6', en: 'Thank you for your help.', th: 'ขอบคุณที่ช่วยเหลือ' },
    ],
  },
  {
    id: 'travel',
    emoji: '✈️',
    title: 'เดินทาง',
    subtitle: 'Travel & airport',
    phrases: [
      { id: 't1', en: 'Here is my passport.', th: 'นี่คือหนังสือเดินทางของฉัน' },
      { id: 't2', en: 'I would like a window seat.', th: 'ขอที่นั่งริมหน้าต่าง', tip: '"would" ตัว l ไม่ออกเสียง อ่านว่า "วูด"' },
      { id: 't3', en: 'What time is the flight?', th: 'เที่ยวบินกี่โมง' },
      { id: 't4', en: 'Where can I get a taxi?', th: 'เรียกแท็กซี่ได้ที่ไหน' },
      { id: 't5', en: 'I have a reservation.', th: 'ฉันจองไว้แล้ว' },
      { id: 't6', en: 'Please take me to this hotel.', th: 'ช่วยพาไปโรงแรมนี้ด้วย' },
    ],
  },
];

export const allPhrases = lessons.flatMap((l) => l.phrases);
