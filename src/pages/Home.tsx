import WelcomeStudioDeck from '../components/WelcomeStudioDeck';
import Projects from './Projects';

export default function Home() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="px-4 pt-4 sm:px-8 sm:pt-6 max-w-[760px] mx-auto w-full">
        <WelcomeStudioDeck />
      </div>
      <Projects />
    </div>
  );
}
