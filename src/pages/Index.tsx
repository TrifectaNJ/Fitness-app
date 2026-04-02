import React from 'react';
import UserLayoutWithChat from '@/components/UserLayoutWithChat';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { HomePageProvider } from '@/contexts/HomePageContext';

const Index: React.FC = () => {
  return (
    <HomePageProvider>
      <BackgroundWrapper page="homepage">
        <UserLayoutWithChat />
      </BackgroundWrapper>
    </HomePageProvider>
  );
};

export default Index;