import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Layout, Image } from 'lucide-react';
import UIEditor from './UIEditor';
import PageElementManager from './PageElementManager';
import { BackgroundImageManager } from './BackgroundImageManager';

const AdminUIEditor: React.FC = () => {
  const [selectedPage, setSelectedPage] = useState<string>('login');

  const pages = [
    { key: 'login', label: 'Login Page' },
    { key: 'home', label: 'Homepage' },
    { key: 'program', label: 'Program Viewer' },
    { key: 'profile', label: 'Profile Page' },
    { key: 'diet', label: 'Diet Page' },
    { key: 'dashboard', label: 'User Dashboard' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">UI Editor</h2>
          <p className="text-gray-600">Customize each page individually</p>
        </div>
        <Select value={selectedPage} onValueChange={setSelectedPage}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select page" />
          </SelectTrigger>
          <SelectContent>
            {pages.map(page => (
              <SelectItem key={page.key} value={page.key}>
                {page.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="elements" className="space-y-6">
        <TabsList>
          <TabsTrigger value="elements">
            <Layout className="w-4 h-4 mr-2" />
            Page Elements
          </TabsTrigger>
          <TabsTrigger value="global">
            <Palette className="w-4 h-4 mr-2" />
            Global Styles
          </TabsTrigger>
          <TabsTrigger value="backgrounds">
            <Image className="w-4 h-4 mr-2" />
            Backgrounds
          </TabsTrigger>
        </TabsList>

        <TabsContent value="elements">
          <Card>
            <CardHeader>
              <CardTitle>
                Editing: {pages.find(p => p.key === selectedPage)?.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PageElementManager pageKey={selectedPage} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="global">
          <UIEditor />
        </TabsContent>

        <TabsContent value="backgrounds">
          <BackgroundImageManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUIEditor;