"use client"
import { motion } from "framer-motion"
import Image from "next/image"
import type { Testimonial } from "../contents/Testimonials"

interface Props {
  testimonial: Testimonial
}

const ReviewCard = ({ testimonial }: Props) => {
  const starArray = Array.from({ length: testimonial.stars }, (_, index) => index + 1)

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      className="bg-white rounded-xl p-6 shadow-lg h-full flex flex-col"
    >
      <div className="flex items-center gap-4 mb-4">
        <Image
          alt={`Foto de ${testimonial.author}`}
          src={testimonial.avatar || "/placeholder.svg"}
          width={56}
          height={56}
          className="h-14 w-14 rounded-full object-cover border-2 border-primary-yellow"
        />
        <div>
          <div className="flex gap-1 text-primary-yellow mb-1">
            {starArray.map((index) => (
              <svg
                key={index}
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-lg font-semibold text-primary-blue font-mon">{testimonial.author}</p>
        </div>
      </div>
      <p className="text-gray-700 font-mon flex-grow">{testimonial.content}</p>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <a
          href="https://maps.app.goo.gl/xuzhiYXCPC2VE9Tp8"
          className="text-second-blue text-sm font-medium hover:underline font-mon flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Ver no Google Maps
        </a>
      </div>
    </motion.div>
  )
}

export default ReviewCard
