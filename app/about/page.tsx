import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function AboutPage() {
  const team = [
    {
      name: 'John Smith',
      role: 'Founder & CEO',
      bio: 'With over 15 years in IT consulting, John leads our team with a vision for exceptional client service.',
      image: '👨‍💼',
    },
    {
      name: 'Sarah Johnson',
      role: 'Lead Technical Architect',
      bio: 'Sarah specializes in cloud infrastructure and has helped dozens of companies modernize their systems.',
      image: '👩‍💻',
    },
    {
      name: 'Michael Chen',
      role: 'Senior Support Engineer',
      bio: 'Michael brings expertise in network security and has resolved thousands of technical issues.',
      image: '👨‍🔧',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Project Manager',
      bio: 'Emily ensures projects are delivered on time and exceed client expectations every time.',
      image: '👩‍💼',
    },
  ];

  const values = [
    {
      title: 'Client-First Approach',
      description: 'Your success is our success. We prioritize your needs and work tirelessly to exceed expectations.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      title: 'Technical Excellence',
      description: 'We stay current with the latest technologies and best practices to deliver cutting-edge solutions.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      title: 'Transparent Communication',
      description: 'Clear, honest communication at every step. No jargon, no surprises—just straightforward service.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      title: 'Continuous Improvement',
      description: 'We constantly refine our processes and expand our expertise to serve you better.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              About Us
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Dedicated to providing exceptional IT support and solutions since 2010
            </p>
          </div>
        </section>

        {/* Company Story */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                  Our Story
                </h2>
                <div className="space-y-4 text-gray-600 text-lg">
                  <p>
                    Tech Support Computer Services was founded in 2010 with a simple mission: to provide businesses with reliable, professional IT support that doesn't break the bank.
                  </p>
                  <p>
                    What started as a one-person operation has grown into a team of dedicated professionals serving hundreds of clients across various industries. Our success is built on a foundation of technical expertise, responsive service, and genuine care for our clients' success.
                  </p>
                  <p>
                    Today, we leverage cutting-edge technology and industry best practices to deliver comprehensive IT solutions—from day-to-day support to complex infrastructure projects. Our client portal makes it easier than ever to manage your IT needs, track projects, and stay connected with our team.
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-lg">
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
                    <div className="text-gray-600">Projects Completed</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="text-4xl font-bold text-green-600 mb-2">200+</div>
                    <div className="text-gray-600">Happy Clients</div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="text-4xl font-bold text-purple-600 mb-2">14+</div>
                    <div className="text-gray-600">Years of Experience</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Our Values
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition"
                >
                  <div className="text-blue-600 mb-4">{value.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Meet Our Team
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Experienced professionals dedicated to your success
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-6 text-center hover:shadow-md transition"
                >
                  <div className="text-6xl mb-4">{member.image}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications & Partnerships */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Certifications & Partnerships
              </h2>
              <p className="text-xl text-gray-600">
                Trusted by industry leaders and certified professionals
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl mb-2">🏆</div>
                  <p className="text-sm font-medium text-gray-700">Microsoft Certified</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl mb-2">☁️</div>
                  <p className="text-sm font-medium text-gray-700">AWS Partner</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl mb-2">🔒</div>
                  <p className="text-sm font-medium text-gray-700">CompTIA Security+</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl mb-2">🌐</div>
                  <p className="text-sm font-medium text-gray-700">Cisco Partner</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Work Together?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Let's discuss how we can help your business thrive with reliable IT support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition font-semibold text-lg"
              >
                Contact Us
              </Link>
              <Link
                href="/services"
                className="inline-block px-8 py-4 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition font-semibold text-lg border-2 border-white"
              >
                View Services
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
