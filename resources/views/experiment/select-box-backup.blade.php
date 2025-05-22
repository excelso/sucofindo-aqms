@vite(['resources/css/experiment-exbox.scss', 'resources/js/experiment/testing-exbox.tsx'])
<div>
    <div>
        <select class="exBoxTest" style="display: none;">
            <option value="1">Jhony Mohade</option>
            <option value="2">Darius</option>
            <option value="3">Tom Holland</option>
        </select>
    </div>
    <br>
    <br>
    <br>
    <br>
    <div class="ex-box" style="display: none">
        <div class="ex-box-container">
            <div class="ex-box-rendered">Jhony Mohade</div>
            <div class="ex-box-arrow"></div>
        </div>
    </div>

    <div class="ex-box-container-result" style="display: none; position: absolute; top: 57px; left: 8px;">
        <div class="ex-box-dropdown">
            <div class="ex-box-search">
                <input type="text" class="ex-box-search-field">
            </div>
            <div class="ex-box-result">
                <ul class="ex-box-result-options">
                    <li class="ex-box-result-options-select selected">
                        <div>Jhony Mohade</div>
                    </li>
                    <li class="ex-box-result-options-select">
                        <div>Darius</div>
                    </li>
                    <li class="ex-box-result-options-select">
                        <div>Tom Holland</div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</div>
