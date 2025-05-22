@vite(['resources/css/app.scss', 'resources/css/experiment-exmenu.scss', 'resources/js/experiment/testing-exmenu.tsx'])

<div style="width: 300px; padding: 20px;">
    <ul class="ex-menu">
        <li class="ex-menu-item">
            <div class="ex-menu-link xxx">
                <span class="ex-menu-arrow">
                    <i class="fas fa-caret-right"></i>
                </span>
                <label for="xx1">Test 1</label>
                <div>
                    <input type="checkbox" id="xx1">
                </div>
            </div>
            <ul class="ex-menu-tree">
                <li class="ex-menu-item">
                    <div class="ex-menu-link">
                        <label for="test01">Test 0.1</label>
                        <div>
                            <input type="checkbox" id="test01">
                        </div>
                    </div>
                </li>
                <li class="ex-menu-item">
                    <div class="ex-menu-link">
                        <label for="test11">Test 1.1</label>
                        <div>
                            <input type="checkbox" id="test11">
                        </div>
                    </div>
                </li>
                <li class="ex-menu-item">
                    <div class="ex-menu-link">
                        <span class="ex-menu-arrow">
                            <i class="fas fa-caret-right"></i>
                        </span>
                        <label for="test12">Test 1.2</label>
                        <div>
                            <input type="checkbox" id="test12">
                        </div>
                    </div>
                    <ul class="ex-menu-tree">
                        <li class="ex-menu-item">
                            <div class="ex-menu-link">
                                <label for="x1">Test 1.1</label>
                                <div>
                                    <input type="checkbox" id="x1">
                                </div>
                            </div>
                        </li>
                        <li class="ex-menu-item">
                            <div class="ex-menu-link">
                                <label for="x2">Test 1.2</label>
                                <div>
                                    <input type="checkbox" id="x2">
                                </div>
                            </div>
                        </li>
                    </ul>
                </li>
            </ul>
        </li>
        <li class="ex-menu-item">
            <div class="ex-menu-link">
                <span class="ex-menu-arrow">
                    <i class="fas fa-caret-right"></i>
                </span>
                <label for="xx2">Test 2</label>
                <div>
                    <input type="checkbox" id="xx2">
                </div>
            </div>
            <ul class="ex-menu-tree">
                <li class="ex-menu-item">
                    <div class="ex-menu-link">
                        <label for="test21">Test 2.1</label>
                        <div>
                            <input type="checkbox" id="test21">
                        </div>
                    </div>
                </li>
                <li class="ex-menu-item">
                    <div class="ex-menu-link">
                        <label for="test22">Test 2.2</label>
                        <div>
                            <input type="checkbox" id="test22">
                        </div>
                    </div>
                </li>
            </ul>
        </li>
    </ul>
</div>


{{-- <ul> --}}
{{--     <li class="ex-menu-item"> --}}
{{--         <div class="ex-menu-link"> --}}
{{--             <span class="ex-menu-arrow"> --}}
{{--                 <i class="fas fa-caret-right"></i> --}}
{{--             </span> --}}
{{--             <label>Test 1</label> --}}
{{--         </div> --}}
{{--         <ul class="ex-menu-tree ex-menu-show"> --}}
{{--             <li class="ex-menu-item"> --}}
{{--                 <div class="ex-menu-link"> --}}
{{--                     <label>Test 1.1</label> --}}
{{--                 </div> --}}
{{--             </li> --}}
{{--             <li class="ex-menu-item"> --}}
{{--                 <div class="ex-menu-link"> --}}
{{--                     <span class="ex-menu-arrow"> --}}
{{--                         <i class="fas fa-caret-right"></i> --}}
{{--                     </span> --}}
{{--                     <label>Test 1.2</label> --}}
{{--                 </div> --}}
{{--                 <ul class="ex-menu-tree ex-menu-show"> --}}
{{--                     <li> --}}
{{--                         <span class="click">Test 1.2.1</span> --}}
{{--                     </li> --}}
{{--                     <li> --}}
{{--                         <span class="click">Test 1.2.2</span> --}}
{{--                     </li> --}}
{{--                 </ul> --}}
{{--             </li> --}}
{{--         </ul> --}}
{{--     </li> --}}
{{-- </ul>   --}}
