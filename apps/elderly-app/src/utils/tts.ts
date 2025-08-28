export function speak(text: string): void {
  const synth = window.speechSynthesis;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'zh-CN';
  synth.cancel();
  synth.speak(utter);
}

