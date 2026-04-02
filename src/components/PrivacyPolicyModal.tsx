import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Privacy Policy</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full max-h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-lg">Privacy Policy for Murray Mania</h3>
              <p className="text-gray-600">Effective Date: 07/06/2025</p>
            </div>
            
            <p>
              Murray Mania is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our mobile application, available on the Google Play Store.
            </p>

            <div>
              <h4 className="font-semibold text-base mb-2">1. Information We Collect</h4>
              <p className="mb-2">We may collect the following types of data:</p>
              
              <div className="ml-4">
                <h5 className="font-medium mb-1">a. User-Provided Information</h5>
                <p className="mb-2">If you choose to create an account or customize your experience, we may collect:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Name or nickname</li>
                  <li>Email address</li>
                  <li>Fitness preferences</li>
                </ul>
                <p className="mt-2 font-medium">Note: We do not collect any health data such as medical conditions, biometric data, or health history.</p>
              </div>

              <div className="ml-4 mt-3">
                <h5 className="font-medium mb-1">b. Automatically Collected Information</h5>
                <p className="mb-2">We may collect non-personal data automatically, including:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Device model and OS version</li>
                  <li>App usage data (e.g., workouts started, screens viewed)</li>
                  <li>Crash logs and performance diagnostics</li>
                  <li>Approximate location (only if required for app features like finding nearby classes)</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-2">2. How We Use Your Information</h4>
              <p className="mb-2">We use this information to:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Provide and improve core features of the app</li>
                <li>Track your workout history or progress (if applicable)</li>
                <li>Personalize the fitness content or recommendations</li>
                <li>Monitor app performance and fix bugs</li>
                <li>Send optional updates or motivational messages</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-2">3. Third-Party Services</h4>
              <p className="mb-2">We may use third-party services that collect and process some data for analytics, ads, or user engagement. These may include:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Google Analytics for Firebase</li>
                <li>Firebase Crashlytics</li>
                <li>Google AdMob (if ads are used)</li>
              </ul>
              <p className="mt-2">Each third-party service has its own privacy policy.</p>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-2">4. Data Sharing</h4>
              <p className="mb-2">We do not sell, rent, or share your personal information with third parties except:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>When required by law</li>
                <li>When using third-party services as mentioned above</li>
                <li>If you explicitly consent to sharing (e.g., connecting with friends or fitness groups)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-2">5. Data Retention</h4>
              <p>
                We retain your data only as long as needed to provide the service, or as required by law. You may request deletion of your data at any time by contacting us.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-2">6. Your Privacy Rights</h4>
              <p className="mb-2">Depending on your country or region, you may have rights to:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Request access to your data</li>
                <li>Request correction or deletion of your data</li>
                <li>Opt out of data collection for analytics or advertising</li>
              </ul>
              <p className="mt-2">You can contact us anytime at: info@trifectagroupco.com</p>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-2">7. Children's Privacy</h4>
              <p>
                This app is not intended for children under 13 (or under 16 in some regions). We do not knowingly collect data from children.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-2">8. Contact Us</h4>
              <p className="mb-2">If you have any questions or concerns about this Privacy Policy, please contact us at:</p>
              <div className="ml-4">
                <p className="font-medium">Trifecta Group</p>
                <p>Email: info@trifectagroupco.com</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacyPolicyModal;