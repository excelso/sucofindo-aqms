@if(isset($items) && count($items) !== 0)
    <div class="card-footer">
        @if($items->hasPages())
            {{$items->withQueryString()->links('pagination::tailwind')}}
        @else
            <nav role="navigation" aria-label="{{ __('Pagination Navigation') }}" class="px-[8px] py-[4px]">
                <div class="flex items-center justify-between sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div class="mr-2">
                        <p class="text-gray-700 leading-5">
                            {{ __('Showing') }} {{ $items->firstItem() }}
                            {{ __('-') }} {{ $items->lastItem() }}
                            {{ __('of') }} {{ $items->total() }}
                        </p>
                    </div>
                    <div class="pagination">
                        <div aria-hidden="true">
                            <span class="prev">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
                                </svg>
                            </span>
                        </div>
                        <div aria-current="page">
                            <span class="loop">1</span>
                        </div>
                        <div aria-hidden="true">
                            <span class="next">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                                </svg>
                            </span>
                        </div>
                    </div>
                </div>
            </nav>
        @endif
    </div>
@elseif(isset($dataDetail) && count($dataDetail) !== 0)
    <div class="card-footer">
        @if($dataDetail->hasPages())
            {{$dataDetail->withQueryString()->links('pagination::tailwind')}}
        @else
            <nav role="navigation" aria-label="{{ __('Pagination Navigation') }}" class="px-[8px] py-[4px]">
                <div class="flex items-center justify-between sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div class="mr-2">
                        <p class="text-gray-700 leading-5">
                            {{ __('Showing') }} {{ $dataDetail->firstItem() }}
                            {{ __('-') }} {{ $dataDetail->lastItem() }}
                            {{ __('of') }} {{ $dataDetail->total() }}
                        </p>
                    </div>
                    <div class="pagination">
                        <div aria-hidden="true">
                            <span class="prev">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
                                </svg>
                            </span>
                        </div>
                        <div aria-current="page">
                            <span class="loop">1</span>
                        </div>
                        <div aria-hidden="true">
                            <span class="next">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                                </svg>
                            </span>
                        </div>
                    </div>
                </div>
            </nav>
        @endif
    </div>
@else
    <div class="card-footer">
        <nav role="navigation" aria-label="{{ __('Pagination Navigation') }}" class="px-[8px] py-[4px]">
            <div class="flex items-center justify-between sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div class="mr-2">
                    <p class="text-gray-700 leading-5">
                        {{ __('Not Found') }}
                    </p>
                </div>
                <div class="pagination">
                    <div class="prev" aria-hidden="true">
                        <i class="fas fa-chevron-left"></i>
                    </div>
                    <div aria-current="page">
                        <span class="relative inline-flex items-center px-4 py-2 -ml-px text-sm font-medium text-white bg-blue-600 border border-gray-300 cursor-default leading-5">1</span>
                    </div>
                    <div class="next" aria-hidden="true">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            </div>
        </nav>
    </div>
@endif
