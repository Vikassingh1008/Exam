export const sampleQuestions = [
  { _id: 'q1', category: 'Computer Fundamentals', questionText: 'Which of the following is an example of an operating system?', options: [{ text: 'Microsoft Word' }, { text: 'Windows 11' }, { text: 'Google Chrome' }, { text: 'Adobe Photoshop' }], correctAnswer: 1, explanation: 'Windows 11 is an operating system. It manages a computer’s hardware and provides the platform on which applications run.' },
  { _id: 'q2', category: 'MS Office', questionText: 'In a spreadsheet, which function is used to calculate the arithmetic mean of a range of values?', options: [{ text: 'COUNT()' }, { text: 'SUM()' }, { text: 'AVERAGE()' }, { text: 'TOTAL()' }], correctAnswer: 2, explanation: 'AVERAGE() adds the values in a range and divides the total by the number of values.' },
  { _id: 'q3', category: 'Computer Fundamentals', questionText: 'What does CPU stand for in a computer system?', options: [{ text: 'Central Processing Unit' }, { text: 'Computer Processing Utility' }, { text: 'Control Program Unit' }, { text: 'Central Program Utility' }], correctAnswer: 0, explanation: 'CPU means Central Processing Unit. It executes program instructions and performs calculations.' },
  { _id: 'q4', category: 'Keyboard Shortcuts', questionText: 'Which keyboard shortcut is commonly used to copy selected text?', options: [{ text: 'Ctrl + X' }, { text: 'Ctrl + C' }, { text: 'Ctrl + V' }, { text: 'Ctrl + Z' }], correctAnswer: 1, explanation: 'Ctrl + C copies a selected item. Ctrl + X cuts it, while Ctrl + V pastes it.' },
  { _id: 'q5', category: 'Networking', questionText: 'Which device converts digital computer signals into a form suitable for transmission over a telephone line?', options: [{ text: 'Scanner' }, { text: 'Printer' }, { text: 'Modem' }, { text: 'Plotter' }], correctAnswer: 2, explanation: 'A modem modulates and demodulates signals so that data can travel over communication lines.' },
  { _id: 'q6', category: 'Internet', questionText: 'A collection of related web pages under one domain is called a:', options: [{ text: 'Website' }, { text: 'Browser' }, { text: 'Search engine' }, { text: 'Hyperlink' }], correctAnswer: 0, explanation: 'A website is a collection of related pages that are typically grouped under one domain name.' },
];

export const createResult = (answers = {}) => {
  const correct = sampleQuestions.filter((question, index) => answers[index] === question.correctAnswer).length;
  const incorrect = sampleQuestions.filter((question, index) => answers[index] !== undefined && answers[index] !== question.correctAnswer).length;
  const attempted = correct + incorrect;
  return { answers, correct, incorrect, attempted, unattempted: sampleQuestions.length - attempted, score: Number((correct - incorrect * 0.25).toFixed(2)) };
};
