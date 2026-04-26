const ProductSkeleton = () => {
    return (
        <div className="product-cart-component border-solid relative border-[1px] border-grey-100 h-[483px] bg-white w-[256px] rounded-xl overflow-hidden shadow-sm animate-pulse">
            <div className="h-[254px] w-full bg-gray-200"></div>
            <div className="grid gap-[10px] mt-6 p-[14px]">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="product-card-component-rating flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                        <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                        <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                        <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                        <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                        <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                    </div>
                </div>
                <div className="w-16 h-5 bg-gray-200 rounded-md mt-2"></div>
                <div className="flex justify-between items-center mt-2">
                    <div className="h-4 bg-gray-200 rounded w-[50%]"></div>
                    <div className="h-4 bg-gray-200 rounded w-[35%]"></div>
                </div>
                <div className="absolute bottom-[20px] w-[90%]">
                    <div className="flex justify-between">
                        <div className="h-5 bg-gray-200 rounded w-16"></div>
                        <div className="h-7 w-8 bg-gray-200 rounded-lg"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductSkeleton;
