import {checkClassList} from "@/js/plugins/functions";

// Interface untuk menyimpan state drag
interface DragState {
    isDragging: boolean;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
}

// Interface untuk menyimpan state resize
interface ResizeState {
    isResizing: boolean;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    resizeType: string;
}

// Fungsi untuk membuat resize handles
const createResizeHandles = (modalMain: HTMLElement) => {
    const handles = [
        { position: 'top-left', cursor: 'nw-resize' },
        { position: 'top-right', cursor: 'ne-resize' },
        { position: 'bottom-left', cursor: 'sw-resize' },
        { position: 'bottom-right', cursor: 'se-resize' },
        { position: 'top', cursor: 'n-resize' },
        { position: 'bottom', cursor: 's-resize' },
        { position: 'left', cursor: 'w-resize' },
        { position: 'right', cursor: 'e-resize' }
    ];

    handles.forEach(handle => {
        const resizeHandle = document.createElement('div');
        resizeHandle.className = `resize-handle resize-${handle.position}`;
        resizeHandle.style.cursor = handle.cursor;
        resizeHandle.setAttribute('data-resize', handle.position);
        modalMain.appendChild(resizeHandle);
    });
};

// Fungsi untuk membuat modal resizable
export const makeResizable = (modal: Element) => {
    const modalMain = modal.querySelector('.modal-main') as HTMLElement;

    if (!modalMain) return;

    // Set initial styles
    modalMain.style.minWidth = '300px';
    modalMain.style.minHeight = '200px';
    modalMain.style.maxWidth = '90vw';
    modalMain.style.maxHeight = '90vh';
    modalMain.style.position = 'relative';

    // Create resize handles
    createResizeHandles(modalMain);

    const resizeState: ResizeState = {
        isResizing: false,
        startX: 0,
        startY: 0,
        startWidth: 0,
        startHeight: 0,
        resizeType: ''
    };

    // Mouse down event untuk resize
    const handleResizeMouseDown = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.classList.contains('resize-handle')) return;

        e.preventDefault();
        e.stopPropagation();

        resizeState.isResizing = true;
        resizeState.startX = e.clientX;
        resizeState.startY = e.clientY;
        resizeState.resizeType = target.getAttribute('data-resize') || '';

        const rect = modalMain.getBoundingClientRect();
        resizeState.startWidth = rect.width;
        resizeState.startHeight = rect.height;

        modalMain.classList.add('resizing');
        document.body.style.userSelect = 'none';
        document.body.style.cursor = target.style.cursor;

        document.addEventListener('mousemove', handleResizeMouseMove);
        document.addEventListener('mouseup', handleResizeMouseUp);
    };

    // Mouse move event untuk resize
    const handleResizeMouseMove = (e: MouseEvent) => {
        if (!resizeState.isResizing) return;

        const deltaX = e.clientX - resizeState.startX;
        const deltaY = e.clientY - resizeState.startY;

        let newWidth = resizeState.startWidth;
        let newHeight = resizeState.startHeight;

        // Calculate new dimensions based on resize type
        switch (resizeState.resizeType) {
            case 'top-left':
                newWidth = resizeState.startWidth - deltaX;
                newHeight = resizeState.startHeight - deltaY;
                break;
            case 'top-right':
                newWidth = resizeState.startWidth + deltaX;
                newHeight = resizeState.startHeight - deltaY;
                break;
            case 'bottom-left':
                newWidth = resizeState.startWidth - deltaX;
                newHeight = resizeState.startHeight + deltaY;
                break;
            case 'bottom-right':
                newWidth = resizeState.startWidth + deltaX;
                newHeight = resizeState.startHeight + deltaY;
                break;
            case 'top':
                newHeight = resizeState.startHeight - deltaY;
                break;
            case 'bottom':
                newHeight = resizeState.startHeight + deltaY;
                break;
            case 'left':
                newWidth = resizeState.startWidth - deltaX;
                break;
            case 'right':
                newWidth = resizeState.startWidth + deltaX;
                break;
        }

        // Apply constraints
        const minWidth = parseInt(modalMain.style.minWidth) || 300;
        const minHeight = parseInt(modalMain.style.minHeight) || 200;
        const maxWidth = window.innerWidth * 0.9;
        const maxHeight = window.innerHeight * 0.9;

        newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

        // Apply new dimensions
        modalMain.style.width = `${newWidth}px`;
        modalMain.style.height = `${newHeight}px`;

        // Adjust modal body max-height
        const modalBody = modalMain.querySelector('.modal-body') as HTMLElement;
        if (modalBody) {
            const headerHeight = modalMain.querySelector('.modal-head')?.getBoundingClientRect().height || 0;
            const footerHeight = modalMain.querySelector('.modal-footer')?.getBoundingClientRect().height || 0;
            modalBody.style.maxHeight = `${newHeight - headerHeight - footerHeight - 40}px`;
        }
    };

    // Mouse up event untuk resize
    const handleResizeMouseUp = () => {
        if (!resizeState.isResizing) return;

        resizeState.isResizing = false;
        modalMain.classList.remove('resizing');
        document.body.style.userSelect = '';
        document.body.style.cursor = '';

        document.removeEventListener('mousemove', handleResizeMouseMove);
        document.removeEventListener('mouseup', handleResizeMouseUp);
    };

    // Attach resize event listeners
    modalMain.addEventListener('mousedown', handleResizeMouseDown);

    // Return cleanup function
    return () => {
        modalMain.removeEventListener('mousedown', handleResizeMouseDown);
        document.removeEventListener('mousemove', handleResizeMouseMove);
        document.removeEventListener('mouseup', handleResizeMouseUp);

        // Remove resize handles
        const handles = modalMain.querySelectorAll('.resize-handle');
        handles.forEach(handle => handle.remove());
    };
};
// Fungsi untuk membuat modal draggable
export const makeDraggable = (modal: Element) => {
    const modalMain = modal.querySelector('.modal-main') as HTMLElement;
    const modalHead = modal.querySelector('.modal-head') as HTMLElement;

    if (!modalMain || !modalHead) return;

    // Set initial styles untuk modal-main
    modalMain.style.position = 'relative';
    modalMain.style.cursor = 'default';

    // Set cursor pointer untuk header
    modalHead.style.cursor = 'move';
    modalHead.style.userSelect = 'none';

    const dragState: DragState = {
        isDragging: false,
        startX: 0,
        startY: 0,
        initialX: 0,
        initialY: 0
    };

    // Mouse down event - mulai drag
    const handleMouseDown = (e: MouseEvent) => {
        // Jangan drag jika click pada resize handle
        const target = e.target as HTMLElement;
        if (target.closest('.resize-handle') ||
                target.closest('.closeModalForm') ||
                target.closest('button') ||
                target.closest('input') ||
                target.closest('select')) {
            return;
        }

        dragState.isDragging = true;
        dragState.startX = e.clientX;
        dragState.startY = e.clientY;

        // Get current transform values
        const transform = modalMain.style.transform;
        const matrix = new DOMMatrix(transform);
        dragState.initialX = matrix.m41; // translateX
        dragState.initialY = matrix.m42; // translateY

        // Add dragging class untuk visual feedback
        modalMain.classList.add('dragging');

        // Prevent text selection
        document.body.style.userSelect = 'none';

        // Add event listeners
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        e.preventDefault();
    };

    // Mouse move event - proses drag
    const handleMouseMove = (e: MouseEvent) => {
        if (!dragState.isDragging) return;

        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;

        const newX = dragState.initialX + deltaX;
        const newY = dragState.initialY + deltaY;

        // Batasi drag agar modal tidak keluar dari viewport
        const modalRect = modalMain.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const maxX = (viewportWidth - modalRect.width) / 2;
        const maxY = (viewportHeight - modalRect.height) / 2;
        const minX = -maxX;
        const minY = -maxY;

        const boundedX = Math.max(minX, Math.min(maxX, newX));
        const boundedY = Math.max(minY, Math.min(maxY, newY));

        modalMain.style.transform = `translate(${boundedX}px, ${boundedY}px)`;
    };

    // Mouse up event - selesai drag
    const handleMouseUp = () => {
        if (!dragState.isDragging) return;

        dragState.isDragging = false;

        // Remove dragging class
        modalMain.classList.remove('dragging');

        // Restore text selection
        document.body.style.userSelect = '';

        // Remove event listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    // Attach mouse down event ke modal header
    modalHead.addEventListener('mousedown', handleMouseDown);

    // Return cleanup function
    return () => {
        modalHead.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };
};

// Fungsi untuk reset posisi modal ke tengah
export const resetModalPosition = (modal: Element) => {
    const modalMain = modal.querySelector('.modal-main') as HTMLElement;
    if (modalMain) {
        modalMain.style.transform = 'translate(0px, 0px)';
    }
};

// Update fungsi showModalDialog untuk include draggable dan resizable functionality
export const showModalDialog = (elm: Element, title?: string, callback?: any, options: {
    draggable?: boolean;
    resizable?: boolean;
} = { draggable: true, resizable: true }) => {
    if (checkClassList(elm, 'hidden')) {
        elm.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');

        if (typeof title !== "undefined") {
            if (title !== null) {
                const titleElm = elm.querySelector('.modal-title');
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = title;
                titleElm?.replaceChildren(tempDiv);
            }
        }

        // Reset posisi modal ke tengah
        resetModalPosition(elm);

        // Store cleanup functions
        const cleanupFunctions: Array<() => void> = [];

        // Buat modal draggable jika diminta
        if (options.draggable !== false) {
            const dragCleanup = makeDraggable(elm);
            if (dragCleanup) cleanupFunctions.push(dragCleanup);
        }

        // Buat modal resizable jika diminta
        if (options.resizable !== false) {
            const resizeCleanup = makeResizable(elm);
            if (resizeCleanup) cleanupFunctions.push(resizeCleanup);
        }

        // Store cleanup functions untuk nanti
        (elm as any)._modalCleanup = cleanupFunctions;

        const event = new Event("show");
        elm.dispatchEvent(event);

        if (typeof callback !== "undefined") {
            callback();
        }
    }
};

export const closeModalDialog = (elm: Element, callback?: any) => {
    if (!checkClassList(elm, 'hidden')) {
        // Cleanup all modal functionality
        if ((elm as any)._modalCleanup) {
            (elm as any)._modalCleanup.forEach((cleanup: () => void) => cleanup());
            delete (elm as any)._modalCleanup;
        }

        elm.classList.add('hidden');

        // Reset modal dimensions and position
        const modalMain = elm.querySelector('.modal-main') as HTMLElement;
        if (modalMain) {
            modalMain.style.width = '';
            modalMain.style.height = '';
            modalMain.style.transform = '';

            // Reset modal body max-height
            const modalBody = modalMain.querySelector('.modal-body') as HTMLElement;
            if (modalBody) {
                modalBody.style.maxHeight = '';
            }
        }

        if (checkClassList(document.body, 'overflow-hidden')) {
            document.body.classList.remove('overflow-hidden');
            document.body.classList.add('overflow-auto');
        }

        if (typeof callback !== "undefined") {
            callback();
        }

        const event = new Event("hidden");
        elm.dispatchEvent(event);
    }
};
