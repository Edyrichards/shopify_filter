import { CheckCircle } from "lucide-react"

export default function FeatureSection() {
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-red-100 px-3 py-1 text-sm text-red-500">Features</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Maximize sales with AI-powered search</h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              No coding is needed. Enhance the shopping experience with AI-powered recommendations and visual
              merchandising.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
          <div className="grid gap-6">
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-red-500" />
                <h3 className="text-xl font-bold">AI Search</h3>
              </div>
              <p className="text-gray-500">Fast, smart results that match your customer's search intent.</p>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-red-500" />
                <h3 className="text-xl font-bold">Personalized Recommendations</h3>
              </div>
              <p className="text-gray-500">Various recommendation settings in home, collection, product & cart page.</p>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-red-500" />
                <h3 className="text-xl font-bold">Visual Merchandising</h3>
              </div>
              <p className="text-gray-500">Tools with pin, boost, demote & hide product strategy.</p>
            </div>
          </div>
          <div className="grid gap-6">
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-red-500" />
                <h3 className="text-xl font-bold">Advanced Product Filter</h3>
              </div>
              <p className="text-gray-500">Custom product filter with options: tag, metafield, variant, etc.</p>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-red-500" />
                <h3 className="text-xl font-bold">Insightful Analytics</h3>
              </div>
              <p className="text-gray-500">Detailed collection filter & search behavior report.</p>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-red-500" />
                <h3 className="text-xl font-bold">Customizable Interface</h3>
              </div>
              <p className="text-gray-500">
                Menu & collection filters that match any theme. New features frequently added.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
