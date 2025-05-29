import type React from "react"
import { LayoutGrid, Bot, BarChartHorizontal, MessageSquare, CuboidIcon as Cube } from "lucide-react"

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-center mb-5">{icon}</div>
    <h3 className="font-medium text-gray-900 mb-3 text-center">{title}</h3>
    <p className="text-gray-500 text-sm text-center">{description}</p>
  </div>
)

export function PlatformInfo() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-10 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-blue-50 p-5 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8">
          <Cube className="h-10 w-10 text-blue-600" />
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-6">AutoML Platform</h1>

        <p className="text-gray-600 mb-12 max-w-xl mx-auto text-lg">
          Build, train, and deploy machine learning models with zero code.
          <br className="hidden md:block" />
          Accelerate your insights with automated EDA, intuitive data workflows, and
          <br className="hidden md:block" />
          in-depth analytics—all in a beautiful, modern workspace.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 max-w-3xl mx-auto">
          <FeatureCard
            icon={<LayoutGrid className="h-7 w-7 text-blue-600" />}
            title="Project Management"
            description="Organize all your ML projects in one place."
          />

          <FeatureCard
            icon={<Bot className="h-7 w-7 text-blue-600" />}
            title="Model Training"
            description="Let AI select and optimize the best algorithms for you."
          />

          <FeatureCard
            icon={<BarChartHorizontal className="h-7 w-7 text-blue-600" />}
            title="Automated EDA"
            description="Visualize data distributions and key insights instantly."
          />

          <FeatureCard
            icon={<MessageSquare className="h-7 w-7 text-blue-600" />}
            title="AI Powered Chat"
            description="Get instant help and explanations at any stage."
          />
        </div>
      </div>
    </div>
  )
}
