<aside class="right-nav-notif close">
    <div class="right-nav-notif-header">
        <div class="cursor-pointer px-[10px] mt-[1px]">
            <i class="far fa-bell"></i>
        </div>
        <div class="ml-[10px]">
            Notifikasi
        </div>
        <div class="close-notif cursor-pointer ml-auto px-[10px] mt-[1px]">
            <i class="fas fa-close"></i>
        </div>
    </div>
    <div class="flex border-b p-2">
        <div class="ml-auto">
            <a class="cursor-pointer text-[12px] text-green-600 mark-all-read">
                Tandai semua dibaca <span class="total-notif-unread"></span>
            </a>
        </div>
    </div>

    <div class="relative h-[calc(100vh-6rem)] overflow-y-auto">
        <div class="data-notif max-h-[calc(100vh-6rem)] overflow-y-auto"></div>
        <div class="notif-loader p-4">
            @for($i = 0; $i < 8; $i++)
                <div class="mb-2">
                    <div class="skeleton-box w-[120px] !h-[15px] rounded-md"></div>
                    <div class="skeleton-box w-full !h-[65px] rounded-md"></div>
                </div>
            @endfor
        </div>
        <div class="absolute top-0 left-0 bottom-0 right-0 flex items-center justify-center data-notif-empty">
            Anda belum memiliki Notifikasi!
        </div>
    </div>
</aside>
