export const MeetTeam = () => {
    const data = [
        { 
            name: "Divyanshi Khandelwal", 
            role: "Frontend Developer", 
            bio: "UI Architecture & Responsive Design",
            initials: "DK",
            bg: "bg-emerald-100 text-emerald-800"
        },
        { 
            name: "Abhinav Joshi", 
            role: "Full Stack Developer", 
            bio: "Core Features & API Integration",
            initials: "AJ",
            bg: "bg-blue-100 text-blue-800"
        },
        { 
            name: "Himanshu Shekhawat", 
            role: "Backend Developer", 
            bio: "Database Optimization & Auth Architecture",
            initials: "HS",
            bg: "bg-amber-100 text-amber-800"
        },
        { 
            name: "Gagan Arora", 
            role: "Full Stack Developer", 
            bio: "Order Workflows & Vendor Management",
            initials: "GA",
            bg: "bg-purple-100 text-purple-800"
        },
        { 
            name: "Madhur Nagariya", 
            role: "UI/UX & Product Design", 
            bio: "User Experience & Visual Identity",
            initials: "MN",
            bg: "bg-rose-100 text-rose-800"
        },
        { 
            name: "Haquenawaz Khan", 
            role: "Lead Full Stack Engineer", 
            bio: "System Architecture, DevOps & Security",
            initials: "HK",
            bg: "bg-teal-100 text-teal-800"
        },
    ];

    return (
        <div className="py-16 px-4 flex justify-center bg-gray-50/50">
            <div className="max-w-6xl w-full flex flex-col items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-3">
                    The People Behind ApnaBazaar
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3 text-center">
                    Meet Our Team
                </h2>
                <p className="text-base text-gray-500 max-w-2xl text-center mb-12">
                    We're a passionate group of engineers and designers dedicated to empowering local farmers and making farm-fresh groceries accessible to all.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl justify-items-center">
                    {data.map((detail, index) => (
                        <div 
                            key={index} 
                            className="bg-white w-full max-w-[320px] p-6 border border-gray-100 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 flex flex-col items-center text-center group"
                        >
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl shadow-inner mb-4 transition-transform duration-300 group-hover:scale-105 ${detail.bg}`}>
                                {detail.initials}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                                {detail.name}
                            </h3>
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full mt-1 mb-2">
                                {detail.role}
                            </span>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                {detail.bio}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};