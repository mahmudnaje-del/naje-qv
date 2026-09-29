import { TranslationSchema } from '../types';
import { en } from './en';

export const ja: TranslationSchema = {
  ...en,
  common: {
    ...en.common,
    welcomeUser: 'ようこそ、{{name}}さん',
  },
  onboarding: {
    ...en.onboarding,
    welcomeTitle: 'NAJE Studioへようこそ',
    welcomeSubtitle: 'アイデアを制作成果につなげるAIプラットフォーム。',
    step1Title: 'アイデアが始まる場所',
    step1Desc: '会話、企画、コンテンツ、デザイン、広告、動画、音声、ドキュメント、ソフトウェアを一つの体験にまとめます。',
    step1CardTitle: '制作ワークフローのために',
    step1CardDesc: '単なるチャット画面ではありません。理解、計画、生成、成果物の作業までを統合します。',
    step2Title: 'スタジオ',
    step2Desc: 'エージェント、プロンプト、広告、モーション、CV、コード、ソース。それぞれ専用の流れがあります。',
    finishBtn: '制作を始める',
    completedToast: 'ツアー完了。NAJE Studioへようこそ。',
  },
  najeModules: {
    najeAgentDesc: 'タスクを分解・計画し、専門ツールで実行するエージェント。',
    najePromptDesc: '最初のアイデアを明確で完成度の高い依頼へ変換。',
    najeAdDesc: 'コンセプトからシーン、最終結果までの広告スタジオ。',
    najeMotionDesc: 'イントロ、アウトロ、ビジュアルモーションの専門企画。',
    najeCvDesc: 'ATS適合を助けるツール付きの履歴書作成。',
    najeDeveloperDesc: 'プロジェクトを扱い、コードを対話し、改善して書き出す。',
    najeSourceDesc: '選んだソースだけを根拠にした対話。',
    creativeStudioDesc: 'アイデア、デザイン、ビジュアルアイデンティティ、販促素材。',
    creativeAiDesc: 'コンテンツとブランドを一か所で。',
  },
};
