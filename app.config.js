import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    plugins: [
      "expo-secure-store",
    ],
    extra: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    },
  };
};
