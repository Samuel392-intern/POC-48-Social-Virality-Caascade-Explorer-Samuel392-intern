import type { Node } from '@/types/cascade';

export default function WhyMattersPanel() {
  return (
    <div className="border-t pt-4">
      <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">Why This Matters</h3>
      <div className="space-y-4 text-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0 h-3 w-3 bg-blue-500 rounded-full mt-1 mr-3"></div>
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-100 mb-1">Understand Viral Dynamics</p>
            <p className="text-gray-600 dark:text-gray-400">
              Visualize how information spreads through networks, identifying critical paths and
              amplification patterns that drive exponential growth.
            </p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0 h-3 w-3 bg-green-500 rounded-full mt-1 mr-3"></div>
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-100 mb-1">Identify Key Influencers</p>
            <p className="text-gray-600 dark:text-gray-400">
              Spot the nodes that drive disproportionate spread - crucial for marketing,
              public health, and information security strategies.
            </p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0 h-3 w-3 bg-purple-500 rounded-full mt-1 mr-3"></div>
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-100 mb-1">Optimize Intervention Timing</p>
            <p className="text-gray-600 dark:text-gray-400">
              See how decay curves inform the best timing for interventions, whether amplifying
              positive content or mitigating harmful misinformation.
            </p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0 h-3 w-3 bg-orange-500 rounded-full mt-1 mr-3"></div>
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-100 mb-1">Resource Allocation Insights</p>
            <p className="text-gray-600 dark:text-gray-400">
              Understand where to focus efforts for maximum impact - whether boosting content
              or containing spread based on network topology and influence patterns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}