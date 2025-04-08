const Rank = ({ updateData }: { updateData: () => void }) => {
  return (
    <div className="col col-span-4 mt-8 md:mt-4 xs:mb-20 xl:mx-auto flex place-self-start items-center p-6 xs:p-2 overflow-x-auto">
      <div className="  p-4 h-[700px] w-[400px] border-r-[1px] border-primary-blue flex flex-col">
        <div className=" block text-black font-mon font-medium mb-2 mt-4 px-5 py-2">Ranking</div>
      </div>
    </div>
  )
}

export default Rank
