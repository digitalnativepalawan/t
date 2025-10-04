
import React from 'react';
import Card from '../components/ui/Card';

interface PlaceholderProps {
    title: string;
}

const Placeholder: React.FC<PlaceholderProps> = ({ title }) => {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            <Card className="flex items-center justify-center h-96">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-white">Coming Soon</h2>
                    <p className="text-gray-400 mt-2">The {title} page is under construction.</p>
                </div>
            </Card>
        </div>
    );
};

export default Placeholder;
